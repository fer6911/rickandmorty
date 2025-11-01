import config from '../config/env.js';
import messageHandler from '../services/messageHandler.js';

class WebhookController {
  async handleIncoming(req, res) {
    try {
      // console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));

      const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      const senderInfo = req.body.entry?.[0]?.changes[0]?.value?.contacts?.[0];

      if (message) {
        await messageHandler.handleIncomingMessage(message, senderInfo);
        // console.log('Procesando mensaje:', message);
        // await messageHandler.handleIncomingMessage(message);
      } else {
        console.log('No se encontró mensaje en la solicitud');
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Error en handleIncoming:', error);
      res.sendStatus(200); // Responder 200 igual para evitar reintentos
    }
  }

  verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Verificando webhook:', { mode, token, challenge });

    if (mode === 'subscribe' && token === config.WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      console.log('✅ Webhook verificado correctamente!');
    } else {
      console.log('❌ Verificación de webhook fallida');
      res.sendStatus(403);
    }
  }
}

export default new WebhookController();