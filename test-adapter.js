// Simple test script to verify adapter works
import { getViemClient } from './config/adapter.js';

console.log('🧪 Testing adapter...');

try {
  const client = getViemClient();
  console.log('✅ Client created:', !!client);
  console.log('✅ Client type:', client?.constructor?.name);
  
  if (client) {
    client.getChainId().then(chainId => {
      console.log('✅ Chain ID:', chainId);
      console.log('✅ Test successful!');
    }).catch(error => {
      console.error('❌ Chain ID test failed:', error);
    });
  }
} catch (error) {
  console.error('❌ Adapter test failed:', error);
}
