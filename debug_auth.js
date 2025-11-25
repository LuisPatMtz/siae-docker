// Script de debugging para pegar en la consola del navegador
// Ejecutar después de hacer login

console.log('=== DEBUGGING AUTH STATE ===');
console.log('Token in localStorage:', localStorage.getItem('token'));
console.log('Token length:', localStorage.getItem('token')?.length);

// Verificar si el token es válido haciendo una petición a /users/me
fetch('http://localhost:8000/users/me', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
})
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('User data:', data);
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
    });

console.log('=== END DEBUG ===');
