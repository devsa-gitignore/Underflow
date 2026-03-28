export async function getStoredToken() {
  const existingToken = localStorage.getItem('swasthya_token');
  if (existingToken) return existingToken;

  const response = await fetch('http://localhost:5000/auth/dev-token');
  if (!response.ok) {
    throw new Error('Unable to fetch dev token');
  }

  const data = await response.json();
  localStorage.setItem('swasthya_token', data.token);
  localStorage.setItem('swasthya_user', JSON.stringify(data));
  return data.token;
}
