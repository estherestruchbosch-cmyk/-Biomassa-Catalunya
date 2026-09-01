const portada = document.getElementById("portada");
const menu = document.getElementById("menu");
const ramadera = document.getElementById("ramadera");
const titolBiomassa = document.getElementById("titolBiomassa");
const contingut = document.getElementById("contingut");
let biomassaActual = "";

document.getElementById("comenca").onclick = function () {

    portada.style.display = "none";
    menu.style.display = "flex";

};

// Obrir pantalla Ramadera



document.querySelectorAll(".icona").forEach(function(icona){

    icona.onclick = function(){

        const tipus = this.dataset.biomassa;
        biomassaActual = tipus;

        const dades = biomasses[tipus];

        titolBiomassa.innerHTML =
            dades.icona + " " + dades.nom;

        contingut.innerHTML =
        `
        <h2>Què és?</h2>

        <p>${dades.quees}</p>
        `;

        menu.style.display = "none";

        ramadera.style.display = "flex";

    }

});

// Tornar al menú

document.getElementById("tornarMenu").onclick = function () {

    ramadera.style.display = "none";
    menu.style.display = "flex";

};

document.querySelectorAll(".opcio").forEach(function(boto){

    boto.onclick = function(){

        const seccio = this.dataset.seccio;

        const dades = biomasses[biomassaActual];

        switch(seccio){

            case "quees":

                contingut.innerHTML = `
                    <h2>📖 Què és?</h2>
                    <p>${dades.quees}</p>
                `;
                break;

            case "distribucio":

    contingut.innerHTML = `
    <h2>🗺 Distribució territorial</h2>

    <p>${dades.distribucio}</p>

    <div id="visor">

        <div id="mapa"></div>

        <div id="infoComarca">

            <h2>📍 Selecciona una comarca</h3>

            <p>Fes clic sobre una comarca del mapa.</p>

        </div>

    </div>
`;

    crearMapa();

    break;
            case "oportunitats i reptes":

                contingut.innerHTML = `
                    <h2>⚠️ Oportunitats i reptes</h2>
                    <p>${dades.reptes}</p>
                `;
                break;

            case "energia":

                contingut.innerHTML = `
                    <h2>⚡ Valor energètic</h2>
                    <p>${dades.energia}</p>
                `;
                break;

        }

    };

});
