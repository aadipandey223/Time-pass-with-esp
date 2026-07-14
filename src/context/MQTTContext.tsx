import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import mqtt from 'mqtt';
import toast from 'react-hot-toast';

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
      // Use ENV for broker to avoid Supabase fetching before authentication
      const brokerUrl = import.meta.env.VITE_MQTT_BROKER || 'wss://test.mosquitto.org:8081';
      const deviceId = import.meta.env.VITE_DEVICE_ID || 'focushub-01';
      
      mqttClient = mqtt.connect(brokerUrl, {
        reconnectPeriod: 5000,
        clientId: `${deviceId}_${Math.random().toString(16).slice(3)}`,
        will: {
          topic: 'myhome/smarthub_xyz/ui_status',
          payload: JSON.stringify({ status: 'offline' }),
          qos: 1,
          retain: false,
        },
        ...(brokerUrl.includes('test.mosquitto.org') ? {} : {
          username: import.meta.env.VITE_MQTT_USER || 'kuchu puchu',
          password: import.meta.env.VITE_MQTT_PASS || 'zebronics',
        })
      });

      setClient(mqttClient);

      mqttClient.on('connect', () => {
        if (!mqttClient || mqttClient.disconnecting) return;
        setStatus('connected');
        toast.success('Connected to MQTT Broker', { id: 'mqtt-status' });
        mqttClient.publish('myhome/smarthub_xyz/ui_status', JSON.stringify({ status: 'online' }));
        mqttClient.subscribe('myhome/smarthub_xyz/#');
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
        const payloadStr = message.toString();
        setLastMessage({ topic, payload: payloadStr });

        // Global intercept for battery alerts
        if (topic === 'myhome/smarthub_xyz/telemetry') {
          try {
            const data = JSON.parse(payloadStr);
            if (data.battery_status === 'low') {
              toast.error(`Low Battery Warning! (${data.battery_percent}%)`, { duration: 5000, id: 'batt-low' });
            } else if (data.battery_status === 'full' || data.battery_percent === 100) {
              toast.success('Battery 100% Charged', { duration: 5000, id: 'batt-full' });
            }
          } catch(e) {}
        }
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
