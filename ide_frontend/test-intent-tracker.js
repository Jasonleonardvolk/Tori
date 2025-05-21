// Simple test script for the Intent Specification Tracker

import intentSpecificationTracker from './src/services/intentSpecificationTracker.js';

// Test function to demonstrate the Intent Specification Tracker
async function testIntentTracker() {
  console.log('Testing Intent Specification Tracker...');
  
  // Initialize the tracker
  const initialized = await intentSpecificationTracker.initialize();
  console.log('Tracker initialized:', initialized);
  
  if (!initialized) {
    console.error('Failed to initialize tracker. Exiting test.');
    return;
  }
  
  // Test 1: Record a new intent
  console.log('\n--- Test 1: Recording a new intent ---');
  const intent1 = {
    specification: 'Implement a responsive navigation menu that collapses on mobile devices',
    codeElements: ['src/components/Navigation.jsx', 'src/styles/navigation.css']
  };
  
  console.log('Recording intent 1...');
  const result1 = await intentSpecificationTracker.recordIntent('intent_1', intent1.specification, intent1.codeElements);
  console.log('Intent 1 recorded:', result1.stored);
  console.log('Conflicts detected:', result1.conflicts.length);
  
  // Test 2: Record a second intent
  console.log('\n--- Test 2: Recording a second intent ---');
  const intent2 = {
    specification: 'Create a fixed header that shows/hides on scroll',
    codeElements: ['src/components/Header.jsx', 'src/styles/header.css']
  };
  
  console.log('Recording intent 2...');
  const result2 = await intentSpecificationTracker.recordIntent('intent_2', intent2.specification, intent2.codeElements);
  console.log('Intent 2 recorded:', result2.stored);
  console.log('Conflicts detected:', result2.conflicts.length);
  
  // Test 3: Record a conflicting intent
  console.log('\n--- Test 3: Recording a conflicting intent ---');
  const intent3 = {
    specification: 'Remove the navigation menu and replace with a sidebar drawer',
    codeElements: ['src/components/Navigation.jsx', 'src/components/Sidebar.jsx', 'src/styles/navigation.css']
  };
  
  console.log('Recording intent 3 (should conflict with intent 1)...');
  const result3 = await intentSpecificationTracker.recordIntent('intent_3', intent3.specification, intent3.codeElements);
  console.log('Intent 3 recorded:', result3.stored);
  console.log('Conflicts detected:', result3.conflicts.length);
  
  if (result3.conflicts.length > 0) {
    console.log('Conflict details:', result3.conflicts);
  }
  
  // Test 4: Record a commit linked to an intent
  console.log('\n--- Test 4: Recording a commit ---');
  const commitResult = intentSpecificationTracker.recordCommit(
    'commit_1',
    ['src/components/Navigation.jsx'],
    'intent_1',
    'Implemented responsive navigation with hamburger menu'
  );
  
  console.log('Commit recorded:', commitResult.success);
  console.log('Commit details:', commitResult.commit);
  
  // Test 5: Get intents for a code element
  console.log('\n--- Test 5: Getting intents for a code element ---');
  const codeElementIntents = intentSpecificationTracker.getIntentsForCode('src/components/Navigation.jsx');
  console.log('Intents for Navigation.jsx:', codeElementIntents.length);
  console.log('Intent IDs:', codeElementIntents.map(intent => intent.id));
  
  // Test 6: Export and import intent history
  console.log('\n--- Test 6: Exporting and importing intent history ---');
  const exportedHistory = intentSpecificationTracker.exportIntentHistory();
  console.log('Exported history contains intents:', exportedHistory.intents.length);
  
  // Clear the current state and import back
  await intentSpecificationTracker.initialize({});
  const importResult = intentSpecificationTracker.importIntentHistory(exportedHistory);
  console.log('History imported:', importResult);
  
  // Verify data was imported correctly
  const intentDetails = intentSpecificationTracker.getIntentDetails('intent_1');
  console.log('Retrieved intent_1 after import:', intentDetails.id);
  console.log('Intent has commits:', intentDetails.commits.length);
  
  console.log('\nIntent Specification Tracker test completed successfully!');
}

// Run the test
testIntentTracker().catch(error => {
  console.error('Error during test:', error);
});
