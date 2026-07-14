import mqtt from 'mqtt';

const host = '7beb2ba940f1465f9bfefbd52a590844.s1.eu.hivemq.cloud';
const options = {
    username: 'kuchu puchu',
    password: 'zebronics',
    clientId: 'focushub-01-test-' + Math.random().toString(16).slice(3),
    connectTimeout: 5000,
};

console.log('Testing WebSocket connection (Port 8884)...');
const wsClient = mqtt.connect(`wss://${host}:8884/mqtt`, options);

wsClient.on('connect', () => {
    console.log('✅ WebSocket Connection Successful!');
    wsClient.end();
    
    console.log('\nTesting Native MQTT TLS connection (Port 8883)...');
    const nativeClient = mqtt.connect(`mqtts://${host}:8883`, options);
    
    nativeClient.on('connect', () => {
        console.log('✅ Native MQTT TLS Connection Successful!');
        nativeClient.end();
    });

    nativeClient.on('error', (err) => {
        console.error('❌ Native MQTT Error:', err.message);
        nativeClient.end();
    });
});

wsClient.on('error', (err) => {
    console.error('❌ WebSocket Error:', err.message);
    wsClient.end();
});
