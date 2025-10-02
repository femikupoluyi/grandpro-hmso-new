const { sql } = require('../config/database');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const QRCode = require('qrcode');

class ContractService {
  constructor() {
    this.contractsDir = path.join(__dirname, '../../uploads/contracts');
    this.templatesDir = path.join(__dirname, '../templates');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    const dirs = [this.contractsDir, this.templatesDir];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Create contract from template
   */
  async generateContract(applicationData, templateId = null) {
    try {
      // Get template
      const template = await this.getContractTemplate(templateId);
      
      // Prepare contract data
      const contractData = {
        contract_number: this.generateContractNumber(),
        hospital_name: applicationData.hospital_name,
        owner_name: applicationData.owner_name,
        date: new Date().toLocaleDateString('en-NG'),
        start_date: new Date().toLocaleDateString('en-NG'),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NG'),
        ...applicationData
      };

      // Compile template with Handlebars
      const compiledTemplate = Handlebars.compile(template.template_content);
      const contractHtml = compiledTemplate(contractData);

      // Generate PDF
      const pdfPath = await this.generatePDF(contractHtml, contractData.contract_number);

      // Save contract to database
      const contract = await sql`
        INSERT INTO contracts (
          contract_number,
          hospital_id,
          owner_id,
          start_date,
          end_date,
          status,
          contract_value,
          payment_terms,
          document_url
        ) VALUES (
          ${contractData.contract_number},
          ${applicationData.hospital_id},
          ${applicationData.owner_id},
          ${new Date()},
          ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)},
          'draft',
          ${applicationData.contract_value || 0},
          ${applicationData.payment_terms || 'Monthly payments'},
          ${pdfPath}
        ) RETURNING *
      `;

      return contract[0];
    } catch (error) {
      console.error('Error generating contract:', error);
      throw error;
    }
  }

  /**
   * Get contract template
   */
  async getContractTemplate(templateId) {
    try {
      let template;
      
      if (templateId) {
        const result = await sql`
          SELECT * FROM contract_templates 
          WHERE id = ${templateId} AND is_active = true
        `;
        template = result[0];
      }

      // If no template found, use default
      if (!template) {
        template = await this.getDefaultTemplate();
      }

      return template;
    } catch (error) {
      console.error('Error fetching contract template:', error);
      throw error;
    }
  }

  /**
   * Get default contract template
   */
  async getDefaultTemplate() {
    // Check if default template exists in database
    const existing = await sql`
      SELECT * FROM contract_templates 
      WHERE template_name = 'Default Hospital Partnership Agreement'
      AND is_active = true
    `;

    if (existing[0]) {
      return existing[0];
    }

    // Create default template
    const defaultTemplate = {
      template_name: 'Default Hospital Partnership Agreement',
      template_type: 'partnership',
      template_content: `
        <h1>HOSPITAL PARTNERSHIP AGREEMENT</h1>
        
        <p>This Agreement is made on {{date}} between:</p>
        
        <p><strong>GrandPro HMSO</strong> (hereinafter referred to as "HMSO")<br/>
        Head Office: Lagos, Nigeria</p>
        
        <p>AND</p>
        
        <p><strong>{{hospital_name}}</strong> (hereinafter referred to as "Partner Hospital")<br/>
        Represented by: {{owner_name}}<br/>
        Address: {{hospital_address}}</p>
        
        <h2>1. TERM</h2>
        <p>This Agreement shall commence on {{start_date}} and continue until {{end_date}}, 
        subject to renewal upon mutual agreement.</p>
        
        <h2>2. SERVICES</h2>
        <p>The Partner Hospital agrees to:</p>
        <ul>
          <li>Provide quality healthcare services to patients</li>
          <li>Maintain compliance with all regulatory requirements</li>
          <li>Utilize the HMSO management platform for operations</li>
          <li>Submit regular reports as required</li>
        </ul>
        
        <h2>3. OBLIGATIONS OF HMSO</h2>
        <p>HMSO agrees to:</p>
        <ul>
          <li>Provide access to the hospital management platform</li>
          <li>Offer technical support and training</li>
          <li>Facilitate patient referrals where applicable</li>
          <li>Provide marketing and promotional support</li>
        </ul>
        
        <h2>4. PAYMENT TERMS</h2>
        <p>{{payment_terms}}</p>
        
        <h2>5. CONFIDENTIALITY</h2>
        <p>Both parties agree to maintain confidentiality of all proprietary information.</p>
        
        <h2>6. TERMINATION</h2>
        <p>This Agreement may be terminated by either party with 90 days written notice.</p>
        
        <h2>7. GOVERNING LAW</h2>
        <p>This Agreement shall be governed by the laws of the Federal Republic of Nigeria.</p>
        
        <p><strong>Contract Number:</strong> {{contract_number}}</p>
      `,
      version: '1.0',
      variables: {
        hospital_name: 'string',
        owner_name: 'string',
        hospital_address: 'string',
        date: 'date',
        start_date: 'date',
        end_date: 'date',
        payment_terms: 'string',
        contract_number: 'string'
      }
    };

    const saved = await sql`
      INSERT INTO contract_templates (
        template_name,
        template_type,
        template_content,
        variables,
        is_active,
        version
      ) VALUES (
        ${defaultTemplate.template_name},
        ${defaultTemplate.template_type},
        ${defaultTemplate.template_content},
        ${defaultTemplate.variables},
        true,
        ${defaultTemplate.version}
      ) RETURNING *
    `;

    return saved[0];
  }

  /**
   * Generate PDF from HTML
   */
  async generatePDF(html, contractNumber) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `contract_${contractNumber}_${Date.now()}.pdf`;
        const filePath = path.join(this.contractsDir, fileName);
        
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);
        
        // Add header
        doc.fontSize(20).text('GrandPro HMSO', 50, 50);
        doc.fontSize(16).text('Hospital Partnership Agreement', 50, 80);
        
        // Convert HTML to PDF content (simplified)
        const cleanText = html.replace(/<[^>]*>/g, '\n').replace(/\n\n+/g, '\n\n');
        doc.fontSize(12).text(cleanText, 50, 120, { width: 500 });
        
        // Add QR code for verification
        QRCode.toDataURL(`verify:${contractNumber}`, (err, url) => {
          if (!err && url) {
            const imgData = url.replace(/^data:image\/png;base64,/, '');
            doc.image(Buffer.from(imgData, 'base64'), 450, 50, { width: 100 });
          }
        });
        
        doc.end();
        
        stream.on('finish', () => {
          resolve(`/contracts/${fileName}`);
        });
        
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate contract number
   */
  generateContractNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `GMHSO-${year}-${random}`;
  }

  /**
   * Add digital signature to contract
   */
  async addDigitalSignature(contractId, signatoryId, signatureData, ipAddress, userAgent) {
    try {
      const verificationCode = require('crypto').randomBytes(32).toString('hex');
      
      const signature = await sql`
        INSERT INTO digital_signatures (
          contract_id,
          signatory_id,
          signature_data,
          signature_type,
          ip_address,
          user_agent,
          verification_code,
          certificate_data
        ) VALUES (
          ${contractId},
          ${signatoryId},
          ${signatureData},
          'electronic',
          ${ipAddress},
          ${userAgent},
          ${verificationCode},
          ${JSON.stringify({
            timestamp: new Date(),
            method: 'electronic_signature',
            device: userAgent
          })}
        ) RETURNING *
      `;

      // Update contract status if all required signatures are collected
      await this.checkAndUpdateContractStatus(contractId);

      return signature[0];
    } catch (error) {
      console.error('Error adding digital signature:', error);
      throw error;
    }
  }

  /**
   * Check and update contract status
   */
  async checkAndUpdateContractStatus(contractId) {
    try {
      const signatures = await sql`
        SELECT COUNT(*) as count 
        FROM digital_signatures 
        WHERE contract_id = ${contractId} 
        AND is_valid = true
      `;

      // If we have at least 2 signatures (hospital owner and HMSO representative)
      if (signatures[0].count >= 2) {
        await sql`
          UPDATE contracts 
          SET status = 'signed', signed_date = CURRENT_TIMESTAMP 
          WHERE id = ${contractId}
        `;
      }
    } catch (error) {
      console.error('Error updating contract status:', error);
    }
  }
}

module.exports = new ContractService();
