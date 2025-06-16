// Simple Jest reporter for failed tests summary
class FailureReporter {
  onRunComplete(contexts, results) {
    const { testResults, numFailedTestSuites, numFailedTests } = results;
    
    if (numFailedTestSuites === 0 && numFailedTests === 0) {
      console.log('\n🎉 All tests passed!');
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('📋 FAILED TESTS SUMMARY');
    console.log('='.repeat(80));
    
    // Group failed tests by suite
    const failedSuites = testResults.filter(result => result.numFailingTests > 0);
    
    console.log(`\n📁 Failed Test Suites (${failedSuites.length}):`);
    console.log('-'.repeat(50));
    
    failedSuites.forEach((suite, index) => {
      const relativePath = suite.testFilePath.replace(process.cwd(), '');
      console.log(`${index + 1}. ${relativePath}`);
      console.log(`   ❌ ${suite.numFailingTests} failed / ${suite.testResults.length} total`);
    });
    
    console.log(`\n🔍 Individual Failed Tests (${numFailedTests}):`);
    console.log('-'.repeat(50));
    
    let testCounter = 1;
    const allFailedTests = []; // Collect all failed tests for quick reference
    
    failedSuites.forEach(suite => {
      const relativePath = suite.testFilePath.replace(process.cwd(), '');
      const failedTests = suite.testResults.filter(test => test.status === 'failed');
      
      failedTests.forEach(test => {
        console.log(`${testCounter}. ${test.title}`);
        console.log(`   📂 File: ${relativePath}`);
        if (test.failureMessages && test.failureMessages.length > 0) {
          const firstLine = test.failureMessages[0].split('\n')[0];
          console.log(`   ⚠️  Error: ${firstLine}`);
        }
        console.log();
        
        // Add to quick reference list
        allFailedTests.push(test.title);
        testCounter++;
      });
    });
    
    console.log('📊 Summary:');
    console.log(`   • Failed Suites: ${numFailedTestSuites}`);
    console.log(`   • Failed Tests: ${numFailedTests}`);
    console.log(`   • Total Tests: ${results.numTotalTests}`);
    console.log('\n' + '='.repeat(80));
    
    // Quick Reference Section - Easy to scan at the bottom
    console.log('🚨 FAILED TESTS QUICK REFERENCE:');
    console.log('='.repeat(80));
    allFailedTests.forEach((testName, index) => {
      console.log(`${index + 1}. ${testName}`);
    });
    console.log('='.repeat(80));
    console.log(`💡 ${numFailedTests} tests need attention`);
    console.log('='.repeat(80));
  }
}

module.exports = FailureReporter; 