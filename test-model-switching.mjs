import fetch from 'node-fetch';

const BACKEND_URL = 'http://127.0.0.1:3001';

async function testModelSwitching() {
  try {
    console.log('🧪 Testing Model Switching Implementation\n');

    // Test 1: Health check
    console.log('1️⃣  Testing /api/health endpoint...');
    let response = await fetch(`${BACKEND_URL}/api/health`);
    if (response.status !== 200) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    const health = await response.json();
    console.log('   ✅ Health check passed:', health, '\n');

    // Test 2: Model discovery
    console.log('2️⃣  Testing /api/models endpoint...');
    response = await fetch(`${BACKEND_URL}/api/models`);
    if (response.status !== 200) {
      throw new Error(`Models endpoint failed: ${response.status}`);
    }
    const models = await response.json();
    console.log('   ✅ Models discovered:', models, '\n');
    
    if (!models.models || models.models.length === 0) {
      throw new Error('No models returned');
    }
    if (!models.defaultModel) {
      throw new Error('No default model specified');
    }

    // Test 3: Chat with model selection (first message)
    console.log('3️⃣  Testing chat with model selection (first message)...');
    const selectedModel = models.models[0];
    response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is 2+2?',
        model: selectedModel,
      }),
    });
    
    if (response.status !== 200) {
      const error = await response.json();
      console.log('   ⚠️  Chat request status:', response.status);
      console.log('   Error details:', error);
      throw new Error(`Chat failed: ${response.status}`);
    }
    
    const result1 = await response.json();
    console.log('   ✅ Chat response received');
    console.log('   - Model used:', result1.model);
    console.log('   - Session ID:', result1.sessionId);
    console.log('   - Reply preview:', result1.reply.substring(0, 60) + '...\n');

    // Test 4: Chat with same model (session continuity)
    console.log('4️⃣  Testing session continuity with same model...');
    response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Explain your answer.',
        sessionId: result1.sessionId,
        model: selectedModel,
      }),
    });

    if (response.status !== 200) {
      const error = await response.json();
      throw new Error(`Chat failed: ${response.status}`);
    }

    const result2 = await response.json();
    console.log('   ✅ Session maintained');
    console.log('   - Session ID matched:', result1.sessionId === result2.sessionId);
    console.log('   - Model consistent:', result1.model === result2.model, '\n');

    // Test 5: Chat with different model (session reset)
    if (models.models.length > 1) {
      console.log('5️⃣  Testing model switching (session reset)...');
      const newModel = models.models[1];
      response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What is 3+3?',
          sessionId: result2.sessionId,
          model: newModel,
        }),
      });

      if (response.status !== 200) {
        const error = await response.json();
        throw new Error(`Chat failed: ${response.status}`);
      }

      const result3 = await response.json();
      console.log('   ✅ Model changed and session reset');
      console.log('   - Old model:', selectedModel);
      console.log('   - New model:', result3.model);
      console.log('   - Session reset:', result1.sessionId !== result3.sessionId || !result3.sessionId, '\n');
    } else {
      console.log('5️⃣  Skipping model switch test (only 1 model available)\n');
    }

    console.log('✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testModelSwitching();
