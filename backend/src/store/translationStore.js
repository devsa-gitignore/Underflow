// Simple in-memory object store for hackerthon
// Stores translation jobs using the format:
// {
//    [jobId]: { status: 'queued' | 'processing' | 'completed' | 'failed', translatedText?: string, error?: string }
// }
const translationStore = {};

export default translationStore;
