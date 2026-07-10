let mapa;
let capaComarques;
let potencial = {};
let biomassaSeleccionada = "forestal";

function crearMapa() {

    if (mapa) {
        mapa.remove();
    }

    mapa = L.map("mapa").setView([41.75, 1.65], 8);

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "© OpenStreetMap"
        }
    ).addTo(mapa);

   carregarPotencial().then(() => {

    carregarComarques();

});
}


function carregarComarques(){

    fetch("data/comarques.geojson")

    .then(resposta => resposta.json())

    .then(function(dades){

    console.log(dades);
    console.log(dades.features);
        capaComarques = L.geoJSON(dades,{

            style:{

                color:"#2e7d32",
                weight:2,
                fillColor:"#81c784",
                fillOpacity:0.5

            },

            onEachFeature:function(feature,layer){

                layer.on({

                    mouseover:function(e){

                        e.target.setStyle({

                            fillColor:"#2e7d32",

                            fillOpacity:0.8

                        });

                    },

                    mouseout:function(e){

                        capaComarques.resetStyle(e.target);

                    },

                click:function(){

    mostrarComarca(feature.properties.NOMCOMAR);

}

                });

            }

        }).addTo(mapa); 
        mapa.fitBounds(capaComarques.getBounds());

    });

}async function carregarPotencial() {

    const resposta = await fetch("data/potencial.csv");
    const text = await resposta.text();

    const linies = text.trim().split("\n");

    const capcalera = linies[0].split(",");

    for (let i = 1; i < linies.length; i++) {

        const valors = linies[i].split(",");

        potencial[valors[0].trim()] = {

            forestal: Number(valors[1]),
            agricola: Number(valors[2]),
            ramadera: Number(valors[3]),
            aquatica: Number(valors[4]),
            industrial: Number(valors[5]),
            urbana: Number(valors[6])

        };

    }

    console.log("Potencial carregat", potencial);

}


function mostrarComarca(nom){

    const info = document.getElementById("infoComarca");

    let valor = "-";

    if (potencial[nom]){

        valor = potencial[nom][biomassaActual];

    }

    info.innerHTML = `

        <h2>📍 ${nom}</h2>

        <hr>

        <p><strong>Biomassa seleccionada</strong></p>

        <p style="font-size:22px">
            ${biomassaActual}
        </p>

        <h3>📊 Potencial</h3>

        <h1>${valor}</h1>

        <progress value="${valor}" max="100"></progress>

    `;

}