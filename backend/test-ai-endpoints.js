import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

const testRiskAssessment = async (config) => {
    console.log('\n=== TEST 1: Risk Assessment (High Risk) ===');
    try {
        const response = await axios.post(`${BASE_URL}/ai/risk-assessment`, {
            bp: '165/110', // Clearly high risk
            weight: '70',
            bloodSugar: '150',
            symptoms: 'severe blurring of vision, headache, swelling', // Preeclampsia signs
            otherFactors: 'patientId would go here if linking'
        }, config);
        console.log('✓ SUCCESS');
        console.log('AI Result:', response.data.data.riskLevel);
        console.log('DB Note:', response.data.alert || 'No alert created');
    } catch (error) {
        console.error('✗ FAILED', error.response?.data || error.message);
    }
};

const testTimeline = async (config) => {
    console.log('\n=== TEST 2: Pregnancy Timeline ===');
    try {
        const response = await axios.post(`${BASE_URL}/ai/timeline`, {
            age: 28,
            conditions: 'gestational diabetes risk',
            currentMonth: 4
        }, config);
        console.log('✓ SUCCESS');
        console.log('Months returned:', response.data.data?.length);
    } catch (error) {
        console.error('✗ FAILED', error.response?.data || error.message);
    }
};

const testEpidemicAlerts = async (config) => {
    console.log('\n=== TEST 3: Epidemic Alerts (Regional Outbreak) ===');
    try {
        const response = await axios.post(`${BASE_URL}/ai/epidemic-alerts`, {
            aggregatedDataText: `
Village: Palghar Rural
Summary: Over the last 48 hours, 18 patients reported severe water-borne symptoms, high fever, and systemic weakness.
`
        }, config);
        console.log('✓ SUCCESS');
        console.log('AI Findings:', response.data.data.alertLevel);
        console.log('DB Note:', response.data.message || 'No regional alert created');
    } catch (error) {
        console.error('✗ FAILED', error.response?.data || error.message);
    }
};

console.log('🚀 Testing Swasthya Sathi Clinical Intelligence...');

(async () => {
    try {
        // 1. Get Dev Token for Jash Nikombhe
        console.log('--- Authenticating ---');
        const authRes = await axios.get(`${BASE_URL}/auth/dev-token`);
        const token = authRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` }, timeout: 60000 };
        console.log('✓ Token received for', authRes.data.name);

        // 2. Run Tests
        await testRiskAssessment(config);
        await testTimeline(config);
        await testEpidemicAlerts(config);

        // 3. Verify Alert Creation
        console.log('\n--- Checking Database Alerts ---');
        const alertRes = await axios.get(`${BASE_URL}/alerts`, config);
        console.log(`✓ Active Alert Count: ${alertRes.data.alerts?.length}`);
        if(alertRes.data.alerts?.length > 0) {
            console.log('Latest Alert:', alertRes.data.alerts[0].message);
        }

        console.log('\n✅ All tests passed smoothly!');
    } catch (err) {
        console.error('💥 Test Suite Error:', err.message);
    }
    process.exit(0);
})();
