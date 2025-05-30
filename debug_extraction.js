// Quick debug script to test the extraction logic
const text = `
Reinforcement learning Based Automated Design of Differential Evolution Algorithm for Black-box Optimization

Abstract: Differential Evolution (DE) is a powerful derivative-free optimizer, but no single variant is superior across all black-box optimization problems (BBOPs). This paper proposes a reinforcement learning (RL) based framework called rlDE that learns to design DE algorithms using meta-learning. The RL agent is implemented with a Double Deep Q-Network (DDQN), and generates DE configurations based on problem characteristics extracted via Exploratory Landscape Analysis (ELA).

The framework leverages meta-learning to enhance the generalizability of the meta-optimizer, enabling it to adapt more effectively across a diverse range of problem scenarios. The experimental results on BBOB2009 demonstrate the effectiveness of the proposed framework.
`;

console.log('🔬 DEBUGGING TYPESCRIPT EXTRACTION');
console.log('Text length:', text.length);
console.log('First 200 chars:', text.substring(0, 200));

const lowerText = text.toLowerCase();

// Test domain terms extraction
const domainTerms = new Map([
    ['algorithm', 0.85], ['machine learning', 0.9], ['artificial intelligence', 0.9],
    ['neural network', 0.85], ['deep learning', 0.85], ['learning', 0.7],
    ['reinforcement learning', 0.95], ['differential evolution', 0.9],
    ['optimization', 0.8], ['meta-learning', 0.85]
]);

console.log('\n🎯 TESTING DOMAIN EXTRACTION:');
let foundTerms = 0;
for (const [term, confidence] of domainTerms) {
    if (lowerText.includes(term)) {
        const frequency = (lowerText.match(new RegExp(term, 'g')) || []).length;
        const score = Math.min(0.95, confidence + (frequency - 1) * 0.05);
        console.log(`✅ Found: ${term} (freq: ${frequency}, score: ${score.toFixed(3)})`);
        foundTerms++;
    }
}

console.log(`\n📊 SUMMARY: Found ${foundTerms} domain terms`);

if (foundTerms === 0) {
    console.log('❌ PROBLEM: No domain terms found! This indicates the extraction logic has an issue.');
} else {
    console.log('✅ Domain extraction working - the issue must be elsewhere.');
}
