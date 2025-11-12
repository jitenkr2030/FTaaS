"use client"

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { TrainingUpdate, DatasetUpdate } from '@/lib/socket'

interface UseWebSocketOptions {
  autoConnect?: boolean
  enableNotifications?: boolean
}

interface SystemNotification {
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, enableNotifications = true } = options
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [trainingUpdates, setTrainingUpdates] = useState<Map<string, TrainingUpdate>>(new Map())
  const [datasetUpdates, setDatasetUpdates] = useState<Map<string, DatasetUpdate>>(new Map())
  const [notifications, setNotifications] = useState<SystemNotification[]>([])

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      
      if (enableNotifications) {
        socket.emit('join-notifications')
      }
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })

    // Training updates
    socket.on('training-update', (update: TrainingUpdate) => {
      console.log('Received training update:', update)
      setTrainingUpdates(prev => new Map(prev).set(update.jobId, update))
    })

    // Dataset updates
    socket.on('dataset-update', (update: DatasetUpdate) => {
      console.log('Received dataset update:', update)
      setDatasetUpdates(prev => new Map(prev).set(update.datasetId, update))
    })

    // System notifications
    socket.on('system-notification', (notification: SystemNotification) => {
      console.log('Received system notification:', notification)
      setNotifications(prev => [...prev, notification])
    })

    // Clean up on unmount
    return () => {
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [autoConnect, enableNotifications])

  // Join a job room to receive updates
  const joinJob = (jobId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-job', jobId)
    }
  }

  // Leave a job room
  const leaveJob = (jobId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-job', jobId)
    }
  }

  // Join a dataset room to receive updates
  const joinDataset = (datasetId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-dataset', datasetId)
    }
  }

  // Leave a dataset room
  const leaveDataset = (datasetId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-dataset', datasetId)
    }
  }

  // Get training update for a specific job
  const getTrainingUpdate = (jobId: string) => {
    return trainingUpdates.get(jobId)
  }

  // Get dataset update for a specific dataset
  const getDatasetUpdate = (datasetId: string) => {
    return datasetUpdates.get(datasetId)
  }

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([])
  }

  // Remove a specific notification
  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index))
  }

  return {
    isConnected,
    trainingUpdates,
    datasetUpdates,
    notifications,
    joinJob,
    leaveJob,
    joinDataset,
    leaveDataset,
    getTrainingUpdate,
    getDatasetUpdate,
    clearNotifications,
    removeNotification,
  }
}