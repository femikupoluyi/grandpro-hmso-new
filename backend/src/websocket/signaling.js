/**
 * WebSocket Signaling Server for WebRTC Video Calls
 * Handles peer-to-peer connection establishment for telemedicine video consultations
 */

const WebSocket = require('ws');
const crypto = require('crypto');

class SignalingServer {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;
    this.consultations = new Map(); // consultationId -> Set of participants
    this.clients = new Map(); // clientId -> { ws, consultationId, participantId }
  }

  /**
   * Start the signaling server
   */
  start() {
    this.wss = new WebSocket.Server({ 
      port: this.port,
      perMessageDeflate: false 
    });

    console.log(`WebRTC Signaling Server started on port ${this.port}`);

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      console.log(`New client connected: ${clientId}`);

      // Store client connection
      this.clients.set(clientId, { 
        ws, 
        consultationId: null, 
        participantId: null,
        connectedAt: new Date().toISOString()
      });

      // Handle client messages
      ws.on('message', (message) => {
        this.handleMessage(clientId, message);
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`Client ${clientId} error:`, error);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'welcome',
        clientId,
        message: 'Connected to signaling server'
      });

      // Setup heartbeat
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
    });

    // Setup heartbeat interval
    this.setupHeartbeat();

    return this.wss;
  }

  /**
   * Handle incoming messages
   */
  handleMessage(clientId, message) {
    try {
      const data = JSON.parse(message);
      const client = this.clients.get(clientId);

      if (!client) {
        console.error(`Client ${clientId} not found`);
        return;
      }

      console.log(`Message from ${clientId}:`, data.type);

      switch (data.type) {
        case 'join':
          this.handleJoin(clientId, data);
          break;
        case 'offer':
          this.handleOffer(clientId, data);
          break;
        case 'answer':
          this.handleAnswer(clientId, data);
          break;
        case 'ice-candidate':
          this.handleIceCandidate(clientId, data);
          break;
        case 'leave':
          this.handleLeave(clientId);
          break;
        case 'chat':
          this.handleChat(clientId, data);
          break;
        case 'screen-share':
          this.handleScreenShare(clientId, data);
          break;
        case 'recording':
          this.handleRecording(clientId, data);
          break;
        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error(`Error handling message from ${clientId}:`, error);
      this.sendError(clientId, 'Invalid message format');
    }
  }

  /**
   * Handle join consultation room
   */
  handleJoin(clientId, data) {
    const { consultationId, participantId, participantType } = data;
    const client = this.clients.get(clientId);

    if (!consultationId || !participantId) {
      this.sendError(clientId, 'consultationId and participantId required');
      return;
    }

    // Update client info
    client.consultationId = consultationId;
    client.participantId = participantId;
    client.participantType = participantType || 'patient';

    // Get or create consultation room
    if (!this.consultations.has(consultationId)) {
      this.consultations.set(consultationId, new Set());
    }

    const consultation = this.consultations.get(consultationId);
    
    // Check if room is full (max 2 participants for 1-on-1 consultation)
    if (consultation.size >= 2 && !consultation.has(clientId)) {
      this.sendError(clientId, 'Consultation room is full');
      return;
    }

    // Add client to consultation
    consultation.add(clientId);

    // Notify client of successful join
    this.sendToClient(clientId, {
      type: 'joined',
      consultationId,
      participantId,
      participantCount: consultation.size
    });

    // Notify other participants
    this.broadcastToConsultation(consultationId, {
      type: 'user-joined',
      participantId,
      participantType,
      participantCount: consultation.size
    }, clientId);

    // If there are other participants, initiate connection
    if (consultation.size > 1) {
      this.sendToClient(clientId, {
        type: 'ready-to-connect',
        message: 'Other participant is in the room, you can create an offer'
      });
    }

    console.log(`Client ${clientId} joined consultation ${consultationId}`);
  }

  /**
   * Handle WebRTC offer
   */
  handleOffer(clientId, data) {
    const { offer, targetParticipantId } = data;
    const client = this.clients.get(clientId);

    if (!client.consultationId) {
      this.sendError(clientId, 'Must join consultation first');
      return;
    }

    // Find target client
    const targetClient = this.findClientByParticipant(
      client.consultationId, 
      targetParticipantId
    );

    if (!targetClient) {
      this.sendError(clientId, 'Target participant not found');
      return;
    }

    // Forward offer to target
    this.sendToClient(targetClient, {
      type: 'offer',
      offer,
      fromParticipantId: client.participantId
    });

    console.log(`Offer forwarded from ${client.participantId} to ${targetParticipantId}`);
  }

  /**
   * Handle WebRTC answer
   */
  handleAnswer(clientId, data) {
    const { answer, targetParticipantId } = data;
    const client = this.clients.get(clientId);

    if (!client.consultationId) {
      this.sendError(clientId, 'Must join consultation first');
      return;
    }

    // Find target client
    const targetClient = this.findClientByParticipant(
      client.consultationId,
      targetParticipantId
    );

    if (!targetClient) {
      this.sendError(clientId, 'Target participant not found');
      return;
    }

    // Forward answer to target
    this.sendToClient(targetClient, {
      type: 'answer',
      answer,
      fromParticipantId: client.participantId
    });

    console.log(`Answer forwarded from ${client.participantId} to ${targetParticipantId}`);
  }

  /**
   * Handle ICE candidate
   */
  handleIceCandidate(clientId, data) {
    const { candidate, targetParticipantId } = data;
    const client = this.clients.get(clientId);

    if (!client.consultationId) {
      this.sendError(clientId, 'Must join consultation first');
      return;
    }

    // Find target client
    const targetClient = this.findClientByParticipant(
      client.consultationId,
      targetParticipantId
    );

    if (!targetClient) {
      // Target might not be connected yet, queue the candidate
      console.log(`Target participant ${targetParticipantId} not found, skipping ICE candidate`);
      return;
    }

    // Forward ICE candidate to target
    this.sendToClient(targetClient, {
      type: 'ice-candidate',
      candidate,
      fromParticipantId: client.participantId
    });
  }

  /**
   * Handle leave consultation
   */
  handleLeave(clientId) {
    const client = this.clients.get(clientId);
    
    if (client && client.consultationId) {
      const consultation = this.consultations.get(client.consultationId);
      
      if (consultation) {
        consultation.delete(clientId);
        
        // Notify other participants
        this.broadcastToConsultation(client.consultationId, {
          type: 'user-left',
          participantId: client.participantId,
          participantCount: consultation.size
        }, clientId);

        // Clean up empty consultations
        if (consultation.size === 0) {
          this.consultations.delete(client.consultationId);
        }
      }

      console.log(`Client ${clientId} left consultation ${client.consultationId}`);
    }
  }

  /**
   * Handle chat message
   */
  handleChat(clientId, data) {
    const { message } = data;
    const client = this.clients.get(clientId);

    if (!client.consultationId) {
      this.sendError(clientId, 'Must join consultation first');
      return;
    }

    // Broadcast chat message to all participants
    this.broadcastToConsultation(client.consultationId, {
      type: 'chat',
      message,
      fromParticipantId: client.participantId,
      timestamp: new Date().toISOString()
    }, clientId);
  }

  /**
   * Handle screen share toggle
   */
  handleScreenShare(clientId, data) {
    const { enabled } = data;
    const client = this.clients.get(clientId);

    if (!client.consultationId) {
      this.sendError(clientId, 'Must join consultation first');
      return;
    }

    // Notify other participants about screen share status
    this.broadcastToConsultation(client.consultationId, {
      type: 'screen-share',
      enabled,
      fromParticipantId: client.participantId
    }, clientId);
  }

  /**
   * Handle recording status
   */
  handleRecording(clientId, data) {
    const { status } = data;
    const client = this.clients.get(clientId);

    if (!client.consultationId) {
      this.sendError(clientId, 'Must join consultation first');
      return;
    }

    // Only allow doctors to control recording
    if (client.participantType !== 'doctor') {
      this.sendError(clientId, 'Only doctors can control recording');
      return;
    }

    // Notify all participants about recording status
    this.broadcastToConsultation(client.consultationId, {
      type: 'recording',
      status,
      message: status === 'started' 
        ? 'This consultation is being recorded' 
        : 'Recording has stopped'
    });
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(clientId) {
    console.log(`Client ${clientId} disconnected`);
    
    // Leave consultation if in one
    this.handleLeave(clientId);
    
    // Remove client
    this.clients.delete(clientId);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Send error to client
   */
  sendError(clientId, errorMessage) {
    this.sendToClient(clientId, {
      type: 'error',
      error: errorMessage
    });
  }

  /**
   * Broadcast to all participants in consultation
   */
  broadcastToConsultation(consultationId, data, excludeClientId = null) {
    const consultation = this.consultations.get(consultationId);
    
    if (!consultation) return;

    consultation.forEach(clientId => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, data);
      }
    });
  }

  /**
   * Find client by participant ID
   */
  findClientByParticipant(consultationId, participantId) {
    for (const [clientId, client] of this.clients) {
      if (client.consultationId === consultationId && 
          client.participantId === participantId) {
        return clientId;
      }
    }
    return null;
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Setup heartbeat to detect disconnected clients
   */
  setupHeartbeat() {
    const interval = setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // Ping every 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      totalClients: this.clients.size,
      activeConsultations: this.consultations.size,
      consultations: Array.from(this.consultations.entries()).map(([id, participants]) => ({
        consultationId: id,
        participantCount: participants.size
      }))
    };
  }

  /**
   * Stop the signaling server
   */
  stop() {
    if (this.wss) {
      // Notify all clients
      this.clients.forEach((client, clientId) => {
        this.sendToClient(clientId, {
          type: 'server-closing',
          message: 'Server is shutting down'
        });
      });

      // Close all connections
      this.wss.clients.forEach(ws => {
        ws.close();
      });

      // Close server
      this.wss.close(() => {
        console.log('Signaling server stopped');
      });
    }
  }
}

// Export for use in other modules
module.exports = SignalingServer;

// Start server if run directly
if (require.main === module) {
  const server = new SignalingServer(process.env.SIGNALING_PORT || 8080);
  server.start();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down signaling server...');
    server.stop();
    process.exit(0);
  });
}
