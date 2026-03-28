import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

const testRiskAssessment = async () => {
    console.log('\n=== TEST 1: Risk Assessment ===');
    try {
        const response = await axios.post(`${BASE_URL}/ai/risk-assessment`, {
            bp: '140/90',
            weight: '65',
            bloodSugar: '145',
            symptoms: 'swelling in feet, headache, fatigue',
            otherFactors: 'first pregnancy, age 28'
        }, { timeout: 30000 });
        console.log('✓ SUCCESS');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('✗ FAILED');
        if (error.response) {
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

const testTimeline = async () => {
    console.log('\n=== TEST 2: Pregnancy Timeline ===');
    try {
        const response = await axios.post(`${BASE_URL}/ai/timeline`, {
            age: 28,
            conditions: 'gestational diabetes risk',
            currentMonth: 4
        }, { timeout: 30000 });
        console.log('✓ SUCCESS');
        console.log('Months returned:', response.data.data?.length);
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('✗ FAILED');
        if (error.response) {
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

const testEpidemicAlerts = async () => {
    console.log('\n=== TEST 3: Epidemic Alerts ===');
    try {
        const response = await axios.post(`${BASE_URL}/ai/epidemic-alerts`, {
            aggregatedDataText: `
Village: Panchgani
Last 7 days: 45 pregnant women, 8 high BP, 12 diarrhea, 6 fever, 15 malnutrition indicators
`
        }, { timeout: 30000 });
        console.log('✓ SUCCESS');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('✗ FAILED');
        if (error.response) {
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

console.log('🚀 Testing AI Features...');
(async () => {
    await testRiskAssessment();
    await testTimeline();
    await testEpidemicAlerts();
    console.log('\n✅ Tests done!');
    process.exit(0);
})();
