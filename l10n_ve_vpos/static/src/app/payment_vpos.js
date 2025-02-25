/** @odoo-module */
import { _t } from "@web/core/l10n/translation";
import { RPCError } from "@web/core/network/rpc_service";
import { PaymentInterface } from "@point_of_sale/app/payment/payment_interface";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
export class PaymentVpos extends PaymentInterface {
  send_payment_request(cid) {
    var self = this;
    super.send_payment_request(...arguments);
    return self._vpos_payment();
  }
  send_payment_cancel(order, cid) {
    super.send_payment_cancel(order, cid);
    return Promise.reject();
  }
  prepareCedula(partner) {
    try {
      return (partner.identity_card || partner.identification_id || partner.vat || null).replace(
        /\D/g,
        ""
      );
    } catch (e) {
      return "";
    }
  }

  async _vpos_payment() {
    const isValidToChange = (payment_method) => {
      if (payment_method.valid_to_change === undefined) {
        return true;
      }
      return payment_method.valid_to_change;
    };

    const order = this.pos.get_order();
    const payLine = order.selected_paymentline;

    if (!isValidToChange(this.payment_method) && payLine.amount <= 0) {
      
        this.env.services.popup.add(ErrorPopup,  {
        title: _t('Error'),
        body: _t('Cannot process transactions with zero or negative amount.'),
      });
      return false;
    }

    const partner = order.get_partner();
    if (!partner) {
        this.env.services.popup.add(ErrorPopup,  {
        title: _t('Error'),
        body: _t('El Cliente debe estar Seleccionado.'),
      });
      return false;
    }

    // const amount = Math.abs(Math.round(payLine.amount * 100));
    const cedula = this.prepareCedula(partner);
    const rate = this.pos.config.show_currency_rate; 
    // Conversión del monto de dólares a bolívares
    if (isNaN(order.formattedAmount)) {
      
      this.env.services.popup.add(ErrorPopup,  {
      title: _t('Error'),
      body: _t('Elimine todos los métodos de pago y vuelva a colocarlo'),
    });
    return false;
  }
    var amountInBs = (order.formattedAmount)
    let amount = Math.round(amountInBs * 100);
    if (amount < 0 && this.payment_method.valid_to_change) {
      amount = Math.abs(amount);  // Convierte a positivo si es negativo
    }
    console.log(amount)
    let data;
    if (this.payment_method.vpos_methodType === 'compraConCards') {
      const monedas = {
        USD: 4,
        VES: 5,
        EU: 9,
      };
      data = {
        accion: 'compraConCards',
        cedula: cedula,
        numeroTarjeta: cedula, 
        saldoPagar: amount,
        tipoMonedero: monedas['VES'],
      };
      try {
        await this._vpos_execute('metodo_cards', data);
        return this.vpos_ok();
      } catch (err) {
        return false;
      }
    } else {
      data = {
        accion: this.payment_method.vpos_methodType,
        montoTransaccion: amount,
        cedula: cedula,
      };
      try {
        await this._vpos_execute('metodo', data);
        return this.vpos_ok();
      } catch (err) {
        return false;
      }
    }
  }

  async vpos_ok(rs) {
    return true;
  }
  async _vpos_execute(metodo, data) {
    const vpos_restApi = this.pos.config.vpos_restApi;
    const params = {
      async: true,
      crossDomain: true,
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      processData: false,
      url: `${vpos_restApi}/vpos/${metodo}`,
      data: JSON.stringify(data),
    };
    return new Promise((resolve, reject) => {
      $.ajax(params)
        .then((rs) => {
          if (["00", "100"].indexOf(rs.codRespuesta) > -1) {
            console.log("*** inicio: respuesta del merchant ***");
            console.log(rs);
            console.log("*** fin: respuesta del merchant ***");

            return resolve(rs);
          } else {
            this._show_error(rs.mensajeRespuesta);
            return reject(false);
          }
        })
        .fail((err) => {
          this._show_error(_t("Cannot connect with vpos"));
          return reject(false);
        });
    });
  }

  _show_error(msg, title) {
    this.env.services.popup.add(ErrorPopup,  {
      title: title || _t("Payment Terminal Error"),
      body: msg,
    });
  }
}

