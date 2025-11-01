import whatsappService from './whatsappService.js';

class MessageHandler {
  constructor() {
    this.userStates = {}; // Almacenar estado de cada usuario
  }

  async handleIncomingMessage(message, senderInfo) {
    try {
      if (message?.type === 'text') {
        const incomingMessage = message.text.body.toLowerCase().trim();
        const userId = message.from;

        console.log('Mensaje recibido:', incomingMessage, 'de:', userId);

        // Verificar si es un saludo inicial
        if (this.isGreeting(incomingMessage)) {
          await this.sendWelcomeMessage(userId, message.id, senderInfo);
          // await this.sendWelcomeMenu(userId);
          // this.userStates[userId] = 'menu'; // Marcar que está en el menú

          //Muestra el menu
          await this.sendWelcomeMenu(message.from)
        }
        // Verificar si el usuario está en el menú y selecciona una opción
        // else if (this.userStates[userId] === 'menu') {
        //   await this.handleMenuOption(userId, incomingMessage, message.id);
        // }
        // Respuesta por defecto

        else {
          const response = `Echo: ${message.text.body}`;
          await whatsappService.sendMessage(userId, response, message.id);
        }

        await whatsappService.markAsRead(message.id);
      } else if (message?.type === 'interactive') {
        const option = message?.interactive?.button_reply?.title.toLowerCase().trim
        await this.handleMenuOption(message.from, option, message.id);
        await whatsappService.markAsRead(message.id)
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
        type: 'reply', reply: { id: 'option_1', title: 'Agendar - Comprar' }
      },
      {
        type: 'reply', reply: { id: 'option_2', title: 'Consultar' }
      },
      {
        type: 'reply', reply: { id: 'option_3', title: 'Ubicación' }
      }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }


  async handleMenuOption(to, option, messageId){
    let response;
    switch (option) {
      case 'Agendar - Comprar':
        // this.appointmentState[to] = { step: 'name' }
        response = "Por favor, ingresa tu nombre:";
        break;
      case 'Consultar':
        // this.assistandState[to] = { step: 'question' };
        response = "Realiza tu consulta";
        break
      case 'Ubicación': 
       response = 'Te esperamos en nuestra sucursal.';
      //  await this.sendLocation(to);
       break
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
      default: 
       response = "Lo siento, no entendí tu selección, Por Favor, elige una de las opciones del menú."
    }
    await whatsappService.sendMessage(to, response, messageId);
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