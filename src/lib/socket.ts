import { Server } from 'socket.io';

export interface TrainingUpdate {
  jobId: string;
  status: 'PENDING' | 'TRAINING' | 'COMPLETED' | 'FAILED' | 'QUEUED';
  progress: number;
  currentEpoch: number;
  totalEpochs: number;
  loss?: number;
  accuracy?: number;
  elapsedTime: number;
  estimatedTime: number;
  message?: string;
}

export interface DatasetUpdate {
  datasetId: string;
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
  progress: number;
  message?: string;
}

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join rooms for specific job/dataset updates
    socket.on('join-job', (jobId: string) => {
      socket.join(`job-${jobId}`);
      console.log(`Client ${socket.id} joined job room: ${jobId}`);
    });

    socket.on('join-dataset', (datasetId: string) => {
      socket.join(`dataset-${datasetId}`);
      console.log(`Client ${socket.id} joined dataset room: ${datasetId}`);
    });

    socket.on('leave-job', (jobId: string) => {
      socket.leave(`job-${jobId}`);
      console.log(`Client ${socket.id} left job room: ${jobId}`);
    });

    socket.on('leave-dataset', (datasetId: string) => {
      socket.leave(`dataset-${datasetId}`);
      console.log(`Client ${socket.id} left dataset room: ${datasetId}`);
    });

    // Broadcast training updates
    socket.on('training-update', (update: TrainingUpdate) => {
      io.to(`job-${update.jobId}`).emit('training-update', update);
      console.log(`Training update broadcast for job ${update.jobId}`);
    });

    // Broadcast dataset updates
    socket.on('dataset-update', (update: DatasetUpdate) => {
      io.to(`dataset-${update.datasetId}`).emit('dataset-update', update);
      console.log(`Dataset update broadcast for dataset ${update.datasetId}`);
    });

    // Handle system-wide notifications
    socket.on('join-notifications', () => {
      socket.join('notifications');
      console.log(`Client ${socket.id} joined notifications room`);
    });

    socket.on('leave-notifications', () => {
      socket.leave('notifications');
      console.log(`Client ${socket.id} left notifications room`);
    });

    // Broadcast system notifications
    socket.on('system-notification', (notification: {
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      timestamp: string;
    }) => {
      io.to('notifications').emit('system-notification', notification);
      console.log(`System notification broadcast: ${notification.title}`);
    });

    // Handle messages (legacy echo functionality)
    socket.on('message', (msg: { text: string; senderId: string }) => {
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to FTaaS Real-time Updates!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

// Helper functions for broadcasting updates
export const broadcastTrainingUpdate = (io: Server, update: TrainingUpdate) => {
  io.to(`job-${update.jobId}`).emit('training-update', update);
};

export const broadcastDatasetUpdate = (io: Server, update: DatasetUpdate) => {
  io.to(`dataset-${update.datasetId}`).emit('dataset-update', update);
};

export const broadcastSystemNotification = (io: Server, notification: {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
}) => {
  io.to('notifications').emit('system-notification', notification);
};