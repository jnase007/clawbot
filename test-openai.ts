import OpenAI from 'openai';
import { config } from 'dotenv';

config();

async function test() {
  console.log('🔑 Testing OpenAI connection...\n');
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: 'Say "Hello from ClawBot! 🦀 Ready to build agents for ProjectHunter.ai!" in a creative way.' }],
    max_tokens: 100,
  });
  
  console.log('✅ OpenAI Connected Successfully!\n');
  console.log('🤖 AI Response:');
  console.log('─'.repeat(50));
  console.log(response.choices[0].message.content);
  console.log('─'.repeat(50));
  console.log('\n📊 Usage:', response.usage);
}

test().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
