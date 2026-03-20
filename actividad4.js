// Actividad 4: "Detective de código"

// Código 1:
var usuarios = [];
function agregarUsuario(nombre, edad) {
    var usuario = {
        nombre: nombre,
        edad: edad
    };
    usuarios.push(usuario);
}
function mostrarUsuarios() {
    for (var i = 0; i < usuarios.length; i++) {
        console.log("Nombre: " + usuarios[i].nombre + " Edad: " +
            usuarios[i].edad);
    }
}

//Mejoras de codigo con emascript 6
const usuarios = [];

const agregarUsuario = (nombre, edad) => {
    const usuario = { nombre, edad };
    usuarios.push(usuario);
};

const mostrarUsuarios = () => {
    usuarios.forEach(({ nombre, edad }) => {
        console.log(`Nombre: ${nombre} Edad: ${edad}`);
    });
};



//Código 2:
fetch("https://jsonplaceholder.typicode.com/users")
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        data.forEach(function (user) {
            console.log(user.name);
        });
    });

//Mejoras de codigo con emascript 6
const obtenerUsuarios = async () => {
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/users");
        const data = await response.json();

        data.forEach(({ name }) => {
            console.log(name);
        });

    } catch (error) {
        console.error("Error al obtener usuarios:", error);
    }
};

obtenerUsuarios();