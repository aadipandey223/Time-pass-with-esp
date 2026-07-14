import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import mqtt from 'mqtt';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

type MqttClient = mqtt.MqttClient;

interface MQTTContextState {
  client: MqttClient | null;
  status: 'connected' | 'reconnecting' | 'disconnected';
  lastMessage: { topic: string; payload: string } | null;
  publish: (topic: string, message: string) => void;
  subscribe: (topic: string) => void;
}

const MQTTContext = createContext<MQTTContextState | undefined>(undefined);

export const MQTTProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<MqttClient | null>(null);
  const [status, setStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<{ topic: string; payload: string } | null>(null);

  useEffect(() => {
    let mqttClient: MqttClient | null = null;

    const initMQTT = async () => {
      // Fetch settings from Supabase
      const { data } = await supabase.from('user_settings').select('mqtt_broker').limit(1).maybeSingle();
      
      const brokerUrl = data?.mqtt_broker || 'wss://test.mosquitto.org:8081';
      const deviceId = import.meta.env.VITE_DEVICE_ID || 'focushub-01';
      
      mqttClient = mqtt.connect(brokerUrl, {
        reconnectPeriod: 5000,
        clientId: `${deviceId}_${Math.random().toString(16).slice(3)}`,
        // Only add credentials if it's not the public test broker
        ...(brokerUrl.includes('test.mosquitto.org') ? {} : {
          username: import.meta.env.VITE_MQTT_USER || 'kuchu puchu',
          password: import.meta.env.VITE_MQTT_PASS || 'zebronics',
        })
      });

      setClient(mqttClient);

      mqttClient.on('connect', () => {
        setStatus('connected');
        toast.success('Connected to MQTT Broker', { id: 'mqtt-status' });
        mqttClient?.subscribe('myhome/smarthub_xyz/#');
      });

      mqttClient.on('reconnect', () => {
        setStatus('reconnecting');
      });

      mqttClient.on('error', (err) => {
        console.error('MQTT Error: ', err);
      });

      mqttClient.on('offline', () => {
        if (status !== 'disconnected') {
          setStatus('disconnected');
          toast.error('MQTT Broker Offline', { id: 'mqtt-status' });
        }
      });

      mqttClient.on('message', (topic, message) => {
        setLastMessage({ topic, payload: message.toString() });
      });
    };

    initMQTT();

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  const publish = useCallback((topic: string, message: string) => {
    if (client && client.connected) {
      client.publish(topic, message);
    } else {
      toast.error('Cannot publish, MQTT offline');
    }
  }, [client]);

  const subscribe = useCallback((topic: string) => {
    if (client && client.connected) {
      client.subscribe(topic);
    }
  }, [client]);

  return (
    <MQTTContext.Provider value={{ client, status, lastMessage, publish, subscribe }}>
      {children}
    </MQTTContext.Provider>
  );
};

export const useMQTT = () => {
  const context = useContext(MQTTContext);
  if (context === undefined) {
    throw new Error('useMQTT must be used within an MQTTProvider');
  }
  return context;
};
