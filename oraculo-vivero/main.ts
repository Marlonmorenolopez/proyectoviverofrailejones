import { CronCapability, HTTPClient, handler, Runner, type Runtime } from "@chainlink/cre-sdk";

const appConfig = {
  semillaId: "1",
  lat: "4.7154",
  lon: "-74.12337",
  owmApiKey: "cda0ccb3bf144492c355b96699cf5d70"
};

const onCronTrigger = (runtime: Runtime<any>) => {
    runtime.log(`?? Chainlink CRE consultando clima de Bogotá...`);
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${appConfig.lat}&lon=${appConfig.lon}&appid=${appConfig.owmApiKey}&units=metric`;
        
        const client = new HTTPClient();
        const request = client.sendRequest(runtime as any, { url: url, method: "GET" });
        const response = request.result(); 
        
        // ?? ESPÍA ACTIVADO: Veamos exactamente en qué formato llegan los datos
        runtime.log(`?? RESPUESTA CRUDA: ${JSON.stringify(response).substring(0, 150)}...`);

        // ?? Decodificador de Bytes para Chainlink
        let data: any;
        if (response.body) {
            if (typeof response.body === "string") {
                // Si por algún milagro llega como texto
                data = JSON.parse(response.body);
            } else {
                // Lo normal en CRE: Traducimos los bytes a texto real usando TextDecoder
                const textoDecodificado = new TextDecoder().decode(new Uint8Array(response.body));
                data = JSON.parse(textoDecodificado);
            }
        } else {
            data = response;
        }

        if (!data || !data.main) {
            throw new Error(`Los datos llegaron pero faltan detalles del clima. Objeto: ${JSON.stringify(data)}`);
        }

        const temperatura = Math.round(data.main.temp * 100);
        const humedad = data.main.humidity;

        runtime.log(`\n? ¡DATOS DECIFRADOS CON EXITO!`);
        runtime.log(`??? Temperatura detectada: ${data.main.temp} C`);
        runtime.log(`?? Humedad detectada: ${humedad} %`);
        
        return JSON.stringify({
            semillaId: appConfig.semillaId,
            temperatura: temperatura,
            humedad: humedad
        });
    } catch (error: any) {
        runtime.log(`? Error fatal en el Oráculo: ${error.message}`);
        throw error;
    }
};

const initWorkflow = (config: any) => {
    const cron = new CronCapability();
    return [ handler(cron.trigger({ schedule: "*/10 * * * * *" }), onCronTrigger) ];
};

export async function main() {
    const runner = await Runner.newRunner();
    await runner.run(initWorkflow);
}
