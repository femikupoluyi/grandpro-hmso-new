import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Inbox, SearchOff, FolderOpen, UserX } from 'lucide-react';

const EmptyState = ({ 
  type = 'default',
  title = 'No data found',
  message = 'There is no data to display at the moment.',
  action,
  actionLabel = 'Add New',
  icon: CustomIcon,
  imageUrl
}) => {
  // Predefined empty state types
  const emptyStateTypes = {
    default: {
      icon: <Inbox size={64} />,
      title: 'No data found',
      message: 'There is no data to display at the moment.'
    },
    search: {
      icon: <SearchOff size={64} />,
      title: 'No results found',
      message: 'Try adjusting your search or filter criteria.'
    },
    patients: {
      icon: <UserX size={64} />,
      title: 'No patients found',
      message: 'Start by registering a new patient.'
    },
    documents: {
      icon: <FolderOpen size={64} />,
      title: 'No documents uploaded',
      message: 'Upload your first document to get started.'
    },
    appointments: {
      icon: <Inbox size={64} />,
      title: 'No appointments scheduled',
      message: 'Schedule your first appointment.'
    }
  };

  const stateConfig = emptyStateTypes[type] || emptyStateTypes.default;
  const displayTitle = title || stateConfig.title;
  const displayMessage = message || stateConfig.message;
  const displayIcon = CustomIcon || stateConfig.icon;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        padding: 4,
        textAlign: 'center'
      }}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Empty state" 
          style={{ 
            width: 200, 
            height: 200, 
            marginBottom: 24,
            opacity: 0.5 
          }} 
        />
      ) : (
        <Box sx={{ color: 'text.disabled', mb: 3 }}>
          {displayIcon}
        </Box>
      )}
      
      <Typography 
        variant="h6" 
        sx={{ mb: 1, color: 'text.primary', fontWeight: 500 }}
      >
        {displayTitle}
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ mb: 3, color: 'text.secondary', maxWidth: 400 }}
      >
        {displayMessage}
      </Typography>
      
      {action && (
        <Button 
          variant="contained" 
          onClick={action}
          sx={{ mt: 1 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
