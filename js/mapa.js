// ========================================
// VARIABLES
// ========================================

let mapa;
let capaComarques;
let potencial = {};

let biomassaSeleccionada = "forestal";


// ========================================
// CONFIGURACIÓ DE CADA BIOMASSA
// ========================================

const configuracioBiomassa = {

    forestal: {
        nom: "biomassa forestal",
        camp: "Forestal",
        pci: 4.2
    },

    ramadera: {
        nom: "biomassa ramadera",
        camp: "Ramadera",
        pci: 1.0
    },

    agricola: {
        nom: "biomassa agrícola",
        camp: "Agricola",
        pci: 4.0
    },

    aquatica: {
        nom: "biomassa aquàtica",
        camp: "Aquatica",
        pci: 2.0
    },


    // ========================================
    // BIOMASSA INDUSTRIAL
    // ========================================

    industrial: {

        nom: "biomassa industrial",

        subcategories: {

            agroalimentaria: {
                nom: "residus de la indústria agroalimentària",
                camp: "industrial_agroalimentaria",

                // Nm³ CH4 / tona
                ch4: 387.5,

                // kWh / Nm³ CH4
                pciCH4: 9.97
            },

            edar: {
                nom: "fangs d'EDAR",
                camp: "industrial_EDAR",

                // Nm³ CH4 / tona
                ch4: 6.5,

                // kWh / Nm³ CH4
                pciCH4: 9.97
            }
        }
    },


    // ========================================
    // BIOMASSA URBANA
    // ========================================

    urbana: {

        nom: "biomassa urbana",

        subcategories: {

            poda: {
                nom: "restes de poda i jardineria",
                camp: "urbana_poda",

                // MWh / tona
                pci: 4.2
            },

            form: {
                nom: "fracció orgànica dels residus municipals (FORM)",
                camp: "urbana_FORM",

                // Nm³ CH4 / tona
                ch4: 111.5,

                // kWh / Nm³ CH4
                pciCH4: 9.97
            }
        }
    }
};


// ========================================
// CREAR MAPA
// ========================================

function crearMapa() {

    // Si ja existeix un mapa,
    // l'eliminem abans de crear-ne un altre

    if (mapa) {
        mapa.remove();
    }


    mapa = L.map("mapa").setView(
        [41.75, 1.65],
        8
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "© OpenStreetMap"
        }
    ).addTo(mapa);


    // Primer carreguem les dades
    // i després les comarques

    carregarPotencial().then(() => {
        carregarComarques();
    });
}


// ========================================
// CARREGAR COMARQUES
// ========================================

function carregarComarques() {

    fetch("data/Comarques.geojson")

        .then(resposta => {

            if (!resposta.ok) {
                throw new Error(
                    "No s'ha pogut carregar Comarques.geojson"
                );
            }

            return resposta.json();
        })

        .then(function(dades) {

            console.log(
                "GeoJSON carregat:",
                dades
            );


            capaComarques = L.geoJSON(

                dades,

                {

                    // ==================================
                    // ESTIL DE LES COMARQUES
                    // ==================================

                    style: function(feature) {

                        const nom =
                            feature.properties.NOMCOMAR;


                        let valor = 0;


                        if (potencial[nom]) {

                            valor =
                                obtenirValorMapa(nom);
                        }


                        console.log(
                            nom,
                            biomassaSeleccionada,
                            valor
                        );


                        return {

                            color: "#444",

                            weight: 1,

                            fillColor:
                                obtenirColor(valor),

                            fillOpacity: 0.8
                        };
                    },


                    // ==================================
                    // INTERACCIÓ
                    // ==================================

                    onEachFeature:
                    function(feature, layer) {


                        // ------------------------------
                        // MOUSEOVER
                        // ------------------------------

                        layer.on({

                            mouseover: function(e) {

                                e.target.setStyle({

                                    fillColor:
                                        "#2e7d32",

                                    fillOpacity:
                                        0.8
                                });
                            },


                            // ------------------------------
                            // MOUSEOUT
                            // ------------------------------

                            mouseout: function(e) {

                                capaComarques
                                    .resetStyle(
                                        e.target
                                    );
                            },


                            // ------------------------------
                            // CLICK
                            // ------------------------------

                            click: function() {

                                mostrarComarca(
                                    feature
                                        .properties
                                        .NOMCOMAR
                                );
                            }
                        });
                    }
                }

            ).addTo(mapa);


            // Ajustar el zoom a Catalunya

            mapa.fitBounds(
                capaComarques.getBounds()
            );
        })


        .catch(function(error) {

            console.error(
                "Error carregant les comarques:",
                error
            );
        });
}


// ========================================
// OBTENIR COLOR SEGONS EL VALOR
// ========================================

function obtenirColor(valor) {

    if (valor === undefined || valor === null) {
        return "#f5f5f5";
    }


    valor = Number(valor);


    if (isNaN(valor) || valor <= 0) {
        return "#f5f5f5";
    }


    // ----------------------------------------
    // ESCALA DE COLORS
    // ----------------------------------------

    // Valor molt baix
    if (valor <= 10) {
        return "#e8f5e9";
    }


    // Valor baix
    if (valor <= 50) {
        return "#c8e6c9";
    }


    // Valor mitjà-baix
    if (valor <= 100) {
        return "#a5d6a7";
    }


    // Valor mitjà
    if (valor <= 250) {
        return "#81c784";
    }


    // Valor mitjà-alt
    if (valor <= 500) {
        return "#66bb6a";
    }


    // Valor alt
    if (valor <= 1000) {
        return "#43a047";
    }


    // Valor molt alt
    if (valor <= 2500) {
        return "#2e7d32";
    }


    // Valor extremadament alt

    return "#1b5e20";
}


// ========================================
// CARREGAR POTENCIAL.CSV
// ========================================

async function carregarPotencial() {

    try {

        const resposta =
            await fetch("data/potencial.csv");


        if (!resposta.ok) {

            throw new Error(
                "No s'ha pogut carregar potencial.csv"
            );
        }


        const text =
            await resposta.text();


        console.log(
            "CONTINGUT DEL CSV:"
        );

        console.log(text);


        // ----------------------------------------
        // NETEJAR EL TEXT
        // ----------------------------------------

        const textNet =
            text
                .replace(/^\uFEFF/, "")
                .replace(/\r/g, "")
                .trim();


        // ----------------------------------------
        // DETECTAR EL SEPARADOR
        // ----------------------------------------

        const primeraLinia =
            textNet.split("\n")[0];


        let separador = ";";


        if (
            primeraLinia.includes(";")
        ) {

            separador = ";";

        }
        else if (
            primeraLinia.includes(",")
        ) {

            separador = ",";
        }


        console.log(
            "Separador detectat:",
            separador
        );


        // ----------------------------------------
        // SEPARAR LES FILES
        // ----------------------------------------

        const linies =
            textNet.split("\n");


        console.log(
            "Nombre de files:",
            linies.length
        );


        // ----------------------------------------
        // CONVERTIR NÚMEROS
        // ----------------------------------------

        function convertirNumero(valor) {

            if (
                valor === undefined ||
                valor === null
            ) {

                return 0;
            }


            valor =
                valor.trim();


            if (
                valor === "" ||
                valor.toUpperCase() === "N/A"
            ) {

                return 0;
            }


            // Eliminar possibles cometes

            valor =
                valor.replace(/"/g, "");


            // Substituir coma decimal si existeix

            valor =
                valor.replace(",", ".");


            // Convertir a número

            const numero =
                parseFloat(valor);


            if (isNaN(numero)) {

                return 0;
            }


            return numero;
        }


        // ----------------------------------------
        // LLEGIR CADA COMARCA
        // ----------------------------------------

        potencial = {};


        for (
            let i = 1;
            i < linies.length;
            i++
        ) {

            if (!linies[i].trim()) {
                continue;
            }


            const valors =
                linies[i].split(separador);


            console.log(
                "Fila",
                i,
                valors
            );


            const nom =
                valors[0]
                    .trim()
                    .replace(/"/g, "");


            if (!nom) {
                continue;
            }


            potencial[nom] = {

                Forestal:
                    convertirNumero(
                        valors[1]
                    ),

                Ramadera:
                    convertirNumero(
                        valors[2]
                    ),

                Agricola:
                    convertirNumero(
                        valors[3]
                    ),

                urbana_poda:
                    convertirNumero(
                        valors[4]
                    ),

                urbana_FORM:
                    convertirNumero(
                        valors[5]
                    ),

                industrial_agroalimentaria:
                    convertirNumero(
                        valors[6]
                    ),

                industrial_EDAR:
                    convertirNumero(
                        valors[7]
                    ),

                Aquatica:
                    convertirNumero(
                        valors[8]
                    )
            };
        }


        console.log(
            "================================"
        );


        console.log(
            "POTENCIAL CARREGAT:"
        );


        console.log(potencial);


        console.log(
            "Segrià:",
            potencial["Segrià"]
        );
    }


    catch (error) {

        console.error(
            "ERROR CARREGANT EL CSV:",
            error
        );
    }
}


// ========================================
// OBTENIR VALOR TOTAL D'UNA BIOMASSA
// ========================================

function obtenirValorMapa(nom) {

    // Si no existeix la comarca

    if (!potencial[nom]) {
        return 0;
    }


    // ========================================
    // BIOMASSA URBANA
    // ========================================

    if (
        biomassaSeleccionada === "urbana"
    ) {

        return (

            potencial[nom].urbana_poda

            +

            potencial[nom].urbana_FORM
        );
    }


    // ========================================
    // BIOMASSA INDUSTRIAL
    // ========================================

    if (
        biomassaSeleccionada === "industrial"
    ) {

        return (

            potencial[nom]
                .industrial_agroalimentaria

            +

            potencial[nom]
                .industrial_EDAR
        );
    }


    // ========================================
    // RESTA DE BIOMASSES
    // ========================================

    const config =
        configuracioBiomassa[
            biomassaSeleccionada
        ];


    if (!config) {

        console.error(
            "No existeix configuració per:",
            biomassaSeleccionada
        );

        return 0;
    }


    const valor =
        potencial[nom][config.camp];


    return valor || 0;
}


// ========================================
// SELECCIONAR BIOMASSA
// ========================================

function seleccionarBiomassa(tipus) {

    console.log(
        "Seleccionant biomassa:",
        tipus
    );


    // ----------------------------------------
    // Comprovar que existeix
    // ----------------------------------------

    if (
        !configuracioBiomassa[tipus]
    ) {

        console.error(
            "Biomassa desconeguda:",
            tipus
        );

        return;
    }


    // ----------------------------------------
    // Actualitzar variable
    // ----------------------------------------

    biomassaSeleccionada =
        tipus;


    console.log(
        "BIOMASSA ACTUAL:",
        biomassaSeleccionada
    );


    // ----------------------------------------
    // Actualitzar mapa
    // ----------------------------------------

    actualitzarMapa();
}


// ========================================
// ACTUALITZAR MAPA
// ========================================

function actualitzarMapa() {

    if (!capaComarques) {
        return;
    }


    capaComarques.setStyle(

        function(feature) {

            const nom =
                feature.properties.NOMCOMAR;


            const valor =
                obtenirValorMapa(nom);


            console.log(
                "Actualitzant:",
                nom,
                biomassaSeleccionada,
                valor
            );


            return {

                color: "#444",

                weight: 1,

                fillColor:
                    obtenirColor(valor),

                fillOpacity: 0.8
            };
        }
    );
}


// ========================================
// MOSTRAR DADES DE LA COMARCA
// ========================================

function mostrarComarca(nom) {

    console.log(
        "================================"
    );


    console.log(
        "COMARCA:",
        nom
    );


    console.log(
        "BIOMASSA:",
        biomassaSeleccionada
    );


    const info =
        document.getElementById(
            "infoComarca"
        );


    const dades =
        potencial[nom];


    // ========================================
    // SI NO HI HA DADES
    // ========================================

    if (!dades) {

        info.innerHTML = `

            <h2>📍 ${nom}</h2>

            <p>
                No hi ha dades disponibles.
            </p>

        `;

        return;
    }


    // ========================================
    // BIOMASSA URBANA
    // ========================================

    if (
        biomassaSeleccionada === "urbana"
    ) {

        mostrarBiomassaUrbana(
            nom,
            dades,
            info
        );

        return;
    }


    // ========================================
    // BIOMASSA INDUSTRIAL
    // ========================================

    if (
        biomassaSeleccionada === "industrial"
    ) {

        mostrarBiomassaIndustrial(
            nom,
            dades,
            info
        );

        return;
    }


    // ========================================
    // RESTA DE BIOMASSES
    // ========================================

    const config =
        configuracioBiomassa[
            biomassaSeleccionada
        ];


    const tones =
        dades[config.camp] || 0;


    const pci =
        config.pci;


    const energia =
        tones * pci;


    console.log(
        "TONES:",
        tones
    );


    console.log(
        "PCI:",
        pci
    );


    console.log(
        "ENERGIA:",
        energia
    );


    // ========================================
    // MOSTRAR RESULTAT
    // ========================================

    info.innerHTML = `

        <h2>📍 ${nom}</h2>

        <hr>

        <p>
            Aquesta comarca disposa de
            <strong>
                ${tones.toLocaleString("ca-ES")}
                tones anuals
            </strong>
            de ${config.nom}.
        </p>

        <p>
            Aquest recurs representa un
            potencial energètic estimat de
            <strong>
                ${energia.toLocaleString(
                    "ca-ES",
                    {
                        maximumFractionDigits: 0
                    }
                )}
                MWh/any
            </strong>.
        </p>

    `;
}


// ========================================
// MOSTRAR BIOMASSA URBANA
// ========================================

function mostrarBiomassaUrbana(
    nom,
    dades,
    info
) {

    const config =
        configuracioBiomassa.urbana;


    // ----------------------------------------
    // PODA
    // ----------------------------------------

    const tonesPoda =
        dades.urbana_poda || 0;


    const pciPoda =
        config.subcategories
            .poda.pci;


    const energiaPoda =
        tonesPoda * pciPoda;


    // ----------------------------------------
    // FORM
    // ----------------------------------------

    const tonesFORM =
        dades.urbana_FORM || 0;


    const ch4FORM =
        config.subcategories
            .form.ch4;


    const pciCH4 =
        config.subcategories
            .form.pciCH4;


    const energiaFORM =
        tonesFORM *
        ch4FORM *
        pciCH4 /
        1000;


    // ----------------------------------------
    // TOTAL
    // ----------------------------------------

    const energiaTotal =
        energiaPoda +
        energiaFORM;


    console.log(
        "PODA:",
        tonesPoda,
        energiaPoda
    );


    console.log(
        "FORM:",
        tonesFORM,
        energiaFORM
    );


    console.log(
        "TOTAL URBANA:",
        energiaTotal
    );


    // ----------------------------------------
    // MOSTRAR
    // ----------------------------------------

    info.innerHTML = `

        <h2>📍 ${nom}</h2>

        <hr>

        <h3>
            🌿 Restes de poda i jardineria
        </h3>

        <p>
            Aquesta comarca disposa de
            <strong>
                ${tonesPoda.toLocaleString("ca-ES")}
                tones anuals
            </strong>
            de restes de poda i jardineria.
        </p>

        <p>
            Amb un PCI de
            <strong>
                ${pciPoda}
                MWh/t
            </strong>,
            representen un potencial energètic de
            <strong>
                ${energiaPoda.toLocaleString(
                    "ca-ES",
                    {
                        maximumFractionDigits: 0
                    }
                )}
                MWh/any
            </strong>.
        </p>


        <h3>
            ♻️ Fracció orgànica dels residus municipals (FORM)
        </h3>

        <p>
            Aquesta comarca disposa de
            <strong>
                ${tonesFORM.toLocaleString("ca-ES")}
                tones anuals
            </strong>
            de FORM.
        </p>

        <p>
            Considerant un potencial de
            <strong>
                ${ch4FORM}
                Nm³ CH₄/t
            </strong>,
            el potencial energètic és de
            <strong>
                ${energiaFORM.toLocaleString(
                    "ca-ES",
                    {
                        maximumFractionDigits: 0
                    }
                )}
                MWh/any
            </strong>.
        </p>


        <hr>

        <p>
            <strong>
                Potencial energètic total de la biomassa urbana:
                ${energiaTotal.toLocaleString(
                    "ca-ES",
                    {
                        maximumFractionDigits: 0
                    }
                )}
                MWh/any
            </strong>
        </p>

    `;
}


// ========================================
// MOSTRAR BIOMASSA INDUSTRIAL
// ========================================

function mostrarBiomassaIndustrial(
    nom,
    dades,
    info
) {

    const config =
        configuracioBiomassa.industrial;


    // ----------------------------------------
    // AGROALIMENTÀRIA
    // ----------------------------------------

    const tonesAgro =
        dades.industrial_agroalimentaria || 0;


    const ch4Agro =
        config.subcategories
            .agroalimentaria.ch4;


    const pciCH4Agro =
        config.subcategories
            .agroalimentaria.pciCH4;


    const energiaAgro =
        tonesAgro *
        ch4Agro *
        pciCH4Agro /
        1000;


    // ----------------------------------------
    // EDAR
    // ----------------------------------------

    const tonesEDAR =
        dades.industrial_EDAR || 0;


    const ch4EDAR =
        config.subcategories
            .edar.ch4;


    const pciCH4EDAR =
        config.subcategories
            .edar.pciCH4;


    const energiaEDAR =
        tonesEDAR *
        ch4EDAR *
        pciCH4EDAR /
        1000;


    // ----------------------------------------
    // TOTAL
    // ----------------------------------------

    const energiaTotal =
        energiaAgro +
        energiaEDAR;


    console.log(
        "AGROALIMENTÀRIA:",
        tonesAgro,
        energiaAgro
    );


    console.log(
        "EDAR:",
        tonesEDAR,
        energiaEDAR
    );


    console.log(
        "TOTAL INDUSTRIAL:",
        energiaTotal
    );


    // ----------------------------------------
    // MOSTRAR
    // ----------------------------------------

    info.innerHTML = `

        <h2>📍 ${nom}</h2>

        <hr>

        <h3>
            🏭 Indústria agroalimentària
        </h3>

        <p>
            Aquesta comarca disposa de
            <strong>
                ${tonesAgro.toLocaleString("ca-ES")}
                tones anuals
            </strong>
            de residus de la indústria
            agroalimentària.
        </p>

        <p>
            Considerant un potencial de
            <strong>
                ${ch4Agro}
                Nm³ CH₄/t
            </strong>,
            el potencial energètic és de
            <strong>
                ${energiaAgro.toLocaleString(
                    "ca-ES",
                    {
                        maximumFractionDigits: 0
                    }
                )}
                MWh/any
            </strong>.
        </p>


        <h3>
            💧 Fangs d'EDAR
        </h3>

        <p>
            Aquesta comarca disposa de
            <strong>
                ${tonesEDAR.toLocaleString("ca-ES")}
                tones anuals
            </strong>
            de fangs d'EDAR.
        </p>

        <p>
            Considerant un potencial de
            <strong>
                ${ch4EDAR}
                Nm³ CH₄/t
            </strong>,
            el potencial energètic és de
            <strong>
                ${energiaEDAR.toLocaleString(
                    "ca-ES",
                    {
                        maximumFractionDigits: 0
                    }
                )}
                MWh/any
            </strong>.
        </p>


        <hr>

        <p>
            <strong>
                Potencial energètic total de la biomassa industrial:
                ${energiaTotal.toLocaleString(
                    "ca-ES",
                    {
                        maximumFractionDigits: 0
                    }
                )}
                MWh/any
            </strong>
        </p>

    `;
}


// ========================================
// BOTONS DEL MENÚ DE BIOMASSA
// ========================================

document.addEventListener(

    "DOMContentLoaded",

    function() {

        const icones =
            document.querySelectorAll(
                ".icona[data-biomassa]"
            );


        icones.forEach(

            function(icona) {

                icona.addEventListener(

                    "click",

                    function() {

                        const tipus =
                            icona.dataset.biomassa;


                        console.log(
                            "ICONA CLICADA:",
                            tipus
                        );


                        seleccionarBiomassa(
                            tipus
                        );
                    }
                );
            }
        );
    }
);
