import whatsappService from './whatsappService.js';
import appendToSheet from './httpRequest/googleSheetsServices.js';
import openAiService from './httpRequest/openAiServices.js';

class MessageHandler {
  constructor() {
    this.appointmentState = {};
    this.assistandState = {};
  }

  async handleIncomingMessage(message, senderInfo) {
    try {
      if (message?.type === 'text') {
        const incomingMessage = message.text.body.toLowerCase().trim();
        this.mediaFiles = {
          'audio': {
            url: 'https://s3.amazonaws.com/gndx.dev/medpet-audio.aac',
            caption: 'Bienvenida',
            type: 'audio'
          },
          'imagen': {
            url: 'https://s3.amazonaws.com/gndx.dev/medpet-imagen.png',
            caption: '¡Esto es una Imagen!',
            type: 'image'
          },
          'video': {
            url: 'https://s3.amazonaws.com/gndx.dev/medpet-video.mp4',
            caption: '¡Esto es un video!',
            type: 'video'
          },
          'documento': {
            url: 'https://s3.amazonaws.com/gndx.dev/medpet-file.pdf',
            caption: '¡Esto es un PDF!',
            type: 'document'
          }
        };
        const userId = message.from;


        // Verificar si es un saludo inicial
      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(userId, message.id, senderInfo);
        await this.sendWelcomeMenu(message.from);
      }
      // Verificar si el mensaje es un tipo de media
      else if (this.mediaFiles[incomingMessage]) {
        await this.sendMedia(userId, incomingMessage);
      }
      // Flujo de citas - PASAR message.id AQUÍ
      else if (this.appointmentState[message.from]) {
        await this.handleAppointmentFlow(message.from, incomingMessage, message.id);
      }
      //ChatGPT
      else if (this.assistandState[message.from]) {
        await this.handleAssistandFlow(message.from, incomingMessage,message.id);
      }
      // Respuesta por defecto
      else {
        const response = `Echo: ${message.text.body}`;
        await whatsappService.sendMessage(userId, response, message.id);
      }

        await whatsappService.markAsRead(message.id);
      } else if (message?.type === 'interactive') {
        const option = message?.interactive?.button_reply?.title.toLowerCase().trim();
        await this.handleMenuOption(message.from, option, message.id);
        await whatsappService.markAsRead(message.id);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  isGreeting(message) {
    const greetings = ["hola", "hello", "hi", "buenas tardes", "buenos días", "buenos dias"];
    return greetings.includes(message);
  }

  getSenderName(senderInfo) {
    return senderInfo.profile?.name || senderInfo.wa_id || ""
  }
  async sendWelcomeMessage(to, messageId, senderInfo) {
    // try {
    const name = this.getSenderName(senderInfo)
    const welcomeMessage = `Hola ${name}, Bienvenido a tu tienda de Rick and Morty en línea.\n¿En qué puedo ayudarte hoy?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
    // } catch (error) {
    //   console.error('Error sending welcome message:', error);
    // }
  }

  async sendWelcomeMenu(to) {
    const menuMessage = "Elige una Opción"
    const buttons = [
      {
        type: 'reply', reply: { id: 'option_1', title: 'Agendar' }
      },
      {
        type: 'reply', reply: { id: 'option_2', title: 'Consultar' }
      },
      {
        type: 'reply', reply: { id: 'option_3', title: 'Ubicación' }
      },
      // {
      //   type: 'reply', reply: { id: 'option_3', title: 'Ubicación' }
      // }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }


  async handleMenuOption(to, option, messageId) {
    let response;
    const optionLower = option.toLowerCase().trim();

    switch (option) {
      case 'agendar':
        this.appointmentState[to] = { step: 'name' }
        response = "Por favor, ingresa tu nombre:";
        break;
      case 'consultar':
        this.assistandState[to] = { step: 'question' };
        response = "Realiza tu consulta";
        break
      case 'ubicacion':
        response = 'Esta es nuestra Ubicación';
        // await this.sendLocation(to);
        break
      default:
        response = "Lo siento, no entendí tu selección, Por Favor, elige una de las opciones del menú."
      // case 'option_1':
      //   this.appointmentState[to] = { step: 'name' }
      //   response = "Por favor, ingresa tu nombre:";
      //   break;
      // case 'option_2':
      //   this.assistandState[to] = { step: 'question' };
      //   response = "Realiza tu consulta";
      //   break
      // case 'option_3': 
      //  response = 'Te esperamos en nuestra sucursal.';
      //  await this.sendLocation(to);
      //  break
    }
    await whatsappService.sendMessage(to, response, messageId);
  }

  async sendMedia(to, mediaType) {
    const media = this.mediaFiles[mediaType];

    if (!media) {
      await whatsappService.sendMessage(to, 'Tipo de media no encontrado');
      return;
    }

    console.log(`Enviando ${mediaType} a ${to}`);
    await whatsappService.sendMediaMessage(to, media.type, media.url, media.caption);
  }

  completeAppointment(to) {
    const appointment = this.appointmentState[to];
    delete this.appointmentState[to];

    const userData = [
      to,
      appointment.name,
      appointment.petName,
      appointment.petType,
      appointment.reason,
      new Date().toISOString()
    ]
    appendToSheet(userData);

    return `Gracias por agendar tu cita. 
    Resumen de tu cita:
    
    Nombre: ${appointment.name}
    Nombre de la mascota: ${appointment.petName}
    Tipo de mascota: ${appointment.petType}
    Motivo: ${appointment.reason}
    
    Nos pondremos en contacto contigo pronto para confirmar la fecha y hora de tu cita.`
  }

  async handleAppointmentFlow(to, message, messageId) {
    const state = this.appointmentState[to];
    let response;

    switch (state.step) {
      case 'name':
        state.name = message;
        state.step = 'petName';
        response = "Gracias, Ahora, ¿Cuál es el nombre de tu Mascota?"
        break;
      case 'petName':
        state.petName = message;
        state.step = 'petType';
        response = '¿Qué tipo de mascota es? (por ejemplo: perro, gato, huron, etc.)'
        break;
      case 'petType':
        state.petType = message;
        state.step = 'reason';
        response = '¿Cuál es el motivo de la Consulta?';
        break;
      case 'reason':
        state.reason = message;
        response = this.completeAppointment(to);
    }
    await whatsappService.sendMessage(to, response, messageId);
  }

    async handleAssistandFlow(to, message,messageId) {
    const state = this.assistandState[to];
    let response;

    const menuMessage = "¿La respuesta fue de tu ayuda?"
    const buttons = [
      { type: 'reply', reply: { id: 'option_4', title: "Si, Gracias" } },
      { type: 'reply', reply: { id: 'option_5', title: 'Hacer otra pregunta'}},
      { type: 'reply', reply: { id: 'option_6', title: 'Emergencia'}}
    ];

    if (state.step === 'question') {
      response = await openAiService(message);
    }

    delete this.assistandState[to];
    await whatsappService.sendMessage(to, response,messageId);
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }
  //   async sendWelcomeMenu(to) {
  //     try {
  //       const menuMessage = `
  // 📦 *Nuestros Productos:*

  // 1️⃣ Camisetas
  // 2️⃣ Figuras de acción
  // 3️⃣ Tazas
  // 4️⃣ Posters
  // 5️⃣ Más...

  // Escribe el número de la opción que deseas explorar.`;

  //       await whatsappService.sendMessage(to, menuMessage, null);
  //       console.log('Menú enviado a:', to);
  //     } catch (error) {
  //       console.error('Error sending menu:', error);
  //     }
  //   }

  //   async handleMenuOption(userId, option, messageId) {
  //     try {
  //       let response = '';

  //       switch(option) {
  //         case '1':
  //           response = `👕 *CAMISETAS*\n\nTenemos camisetas exclusivas de Rick and Morty:\n\n- Camiseta Classic Rick\n- Camiseta Morty Adventure\n- Camiseta Portal\n\n¿Cuál te interesa? Escribe el nombre o vuelve al menú escribiendo "menú"`;
  //           break;
  //         case '2':
  //           response = `🎬 *FIGURAS DE ACCIÓN*\n\nColección completa de personajes:\n\n- Rick Sanchez\n- Morty Smith\n- Summer Smith\n- Mr. Poopybutthole\n\n¿Cuál prefieres? Escribe el nombre o "menú" para volver`;
  //           break;
  //         case '3':
  //           response = `☕ *TAZAS*\n\nTazas temáticas:\n\n- Taza Portal\n- Taza Quotes Rick\n- Taza Spaceman\n- Taza Pickle Rick\n\n¿Cuál te gusta? Escribe el nombre o "menú" para volver`;
  //           break;
  //         case '4':
  //           response = `🖼️ *POSTERS*\n\nPosters de alta calidad:\n\n- Poster Oficial Serie\n- Poster Minimalist\n- Poster Citaciones\n- Poster Portal\n\n¿Cuál eliges? Escribe el nombre o "menú" para volver`;
  //           break;
  //         case '5':
  //           response = `🎁 *MÁS PRODUCTOS*\n\nTambién contamos con:\n\n- Gorras\n- Mochilas\n- Fundas para teléfono\n- Llaveros\n- Calcomanías\n\n¿Qué te interesa? Escribe "menú" para volver al menú principal`;
  //           break;
  //         case 'menu':
  //           await this.sendWelcomeMenu(userId);
  //           return;
  //         default:
  //           response = `No entendí tu opción. Por favor, escribe un número del 1 al 5 o "menú" para volver`;
  //       }

  //       await whatsappService.sendMessage(userId, response, messageId);
  //       console.log('Opción procesada:', option, 'para usuario:', userId);
  //     } catch (error) {
  //       console.error('Error handling menu option:', error);
  //     }
  //   }
}

export default new MessageHandler();