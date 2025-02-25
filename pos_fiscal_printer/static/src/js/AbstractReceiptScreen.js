
/** @odoo-module **/

import { Payment, Order } from "@point_of_sale/app/store/models";
import { Component, useState } from "@odoo/owl";
//import AbstractReceiptScreen from 'point_of_sale.AbstractReceiptScreen';
import { PrintingMixin } from "./PrintingMixin";
import { ClosePosPopup } from "@point_of_sale/app/navbar/closing_popup/closing_popup";
import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { ReceiptScreen } from "@point_of_sale/app/screens/receipt_screen/receipt_screen";
import { ReprintReceiptScreen } from "@point_of_sale/app/screens/receipt_screen/reprint_receipt_screen";
import { useService } from "@web/core/utils/hooks";

import { NotaCreditoPopUp } from "./NotaCreditoPopUp";

export function convert(amount, fixed = 2) {
  return (amount || 0).toFixed(fixed).replace(".", ",");
}
export function rate(){
  return this.pos.config.show_currency_rate; 
}

patch(Payment.prototype, {
  setup(obj, options) {
    super.setup(...arguments);
    this.x_printer_code = this.payment_method.x_printer_code;
  },
  init_from_JSON(json) {
    super.init_from_JSON(...arguments);
    this.x_printer_code = json.x_printer_code;
  },
  export_as_JSON() {
    const json = super.export_as_JSON();
    json.x_printer_code = this.x_printer_code;
    return json;
  },
});

patch(Order.prototype, {
  setup(_defaultObj, options) {
    super.setup(...arguments);
    this.impresa = false;
    this.num_factura = false;
  },
  init_from_JSON(json) {
    super.init_from_JSON(...arguments);
    this.num_factura = json.num_factura;
    this.impresa = json.impresa;
  },
  export_as_JSON() {
    const receipt = super.export_as_JSON(...arguments);
    receipt.num_factura = this.num_factura;
    return receipt;
  },
});

// Registries.Model.extend(PosGlobalState, (Parent) => class extends Parent {
//     serialPort = null;
// });

patch(ClosePosPopup.prototype, {

  setup() {
    super.setup();
    this.PrintingMixin = new  PrintingMixin();
},


  openDetailsPopup() {
    this.state.zReport = "";
    return super.openDetailsPopup();
  },

  async closeSession() {
    await super.closeSession();
    if (this.state.zReport === "" || !this.state.zReport) {
      console.log("closeSession sin reporte Z");
    } else {
      console.log("closeSession con reporte Z");
      await this.orm.call("pos.session", "set_z_report", [
        this.pos.pos_session,
        this.state.zReport,
      ]);
    }
  },
  async printZReport() {
    if (this.pos.config.connection_type === "api") {
      this.PrintingMixin.printZViaApi();
    } else {
      this.PrintingMixin.printerCommands = [];
      this.PrintingMixin.read_Z = false;
      this.PrintingMixin.printerCommands.push("I0Z");
      this.PrintingMixin.actionPrint();
    }
  },
  async printXReport() {
    if (this.pos.config.connection_type === "api") {
      this.PrintingMixin.printXViaApi();
    } else {
      this.PrintingMixin.printerCommands = [];
      this.PrintingMixin.read_Z = false;
      this.PrintingMixin.printerCommands.push("I0X");
      this.PrintingMixin.actionPrint();
    }
  },
});

// patch(PaymentScreen.prototype, {
//   async validateOrder(isForceValidate) {
//     if (!this.currentOrder.partner) {
//       this.env.services.popup.add(ErrorPopup, {
//         title: "Error",
//         body: "El cliente es obligatorio para proceder",
//       });
//       return;
//     }
//     await super.validateOrder(isForceValidate);
//   },
// });

patch(PaymentScreen.prototype, {
  async validateOrder(isForceValidate) {
    // Obtener la orden actual
    const order = this.currentOrder;

    // Verificar si hay un cliente asignado a la orden
    if (!order.partner) {
      this.env.services.popup.add(ErrorPopup, {
        title: "Error",
        body: "El cliente es obligatorio para proceder",
      });
      return;
    }

    // Verificar si existe un monto pendiente, positivo o negativo
    const pendingAmount = order.get_due(); 
    // Obtiene el monto pendiente de la orden
    if (pendingAmount < 0) {
      this.env.services.popup.add(ErrorPopup, {
        title: "Error",
        body: "se debe realizar el vuelto para poder continuar...",
      });
      return;
    }
    
    if (pendingAmount !== 0) {
      this.env.services.popup.add(ErrorPopup, {
        title: "Error",
        body: "No puede proceder mientras haya un monto pendiente.",
      });
      return;
    }
    if (pendingAmount < 0) {
      this.env.services.popup.add(ErrorPopup, {
        title: "Error",
        body: "se debe realizar el vuelto para poder continuar...",
      });
      return;
    }

    // Si no hay monto pendiente y el cliente está asignado, continuar con la validación
    await super.validateOrder(isForceValidate);
  },
});






const printingMixingReceipScreen = {
  setup() {
    super.setup();
    this.popup = useService("popup");
    this.utilsPrinting = new PrintingMixin(this.pos);
    
  },
  // orderDone() {
  //   if (this.currentOrder.impresa) {
  //     this.pos.removeOrder(this.currentOrder);
  //     this._addNewOrder();
  //     const { name, props } = this.nextScreen;
  //     this.showScreen(name, props);
  //     if (this.pos.config.iface_customer_facing_display) {
  //       this.pos.send_current_order_to_customer_facing_display();
  //     }
  //   } else {
  //     this.env.services.popup.add(ErrorPopup, {
  //       title: "Error",
  //       body: "Debe imprimir el documento fiscal",
  //     });
  //   }
  // },
  get order() {
    return this.constructor.name === "ReprintReceiptScreen"
      ? this.props.order
      : this.pos.get_order();
  },
  async doPrinting(mode) {
    console.log(this.order)
    
    if (
      !this.order
        .get_paymentlines()
        .every(({ x_printer_code }) => Boolean(x_printer_code))
    ) {
      return this.pos.popup.add(ErrorPopup, {
        title: "Error",
        body: "Algunos métodos de pago no tienen código de impresora",
      });
      //return
    }
    if (this.order.impresa) {
      return this.pos.popup.add(ErrorPopup, {
        title: "Error",
        body: "Documento impreso en máquina fiscal",
      });
      //return;
    }
    this.utilsPrinting.printerCommands = [];
    switch (mode) {
      case "noFiscal":
        this.printNoFiscal();
        break;
      case "fiscal":
        
        this.read_s2 = true;
        this.printFiscal();
        
        break;
      case "notaCredito":
        this.read_s2 = true;
        const result = await this.printNotaCredito();
        if (!result) return;
        break;
    }

    //this.utilsPrinting.printerCommands.unshift("7");

    //debugger;
    if (this.pos.config.connection_type === "usb") {
      this.utilsPrinting.printViaUSB();
    } else if (this.pos.config.connection_type === "serial") {
      this.utilsPrinting.actionPrint();
    } else if (this.pos.config.connection_type === "usb_serial") {
      this.utilsPrinting.actionPrint();
    } else if (this.pos.config.connection_type === "api") {
      this.utilsPrinting.printViaApi();
    } else {
      this.utilsPrinting.actionPrint();
    }
  },



  setHeader(payload) {

    const client = this.order.partner;
    
    if (this.pos.config.aplicar_igtf  && this.order.sigtef) {
      this.utilsPrinting.printerCommands.push("PJ5001*");

    }else{
      this.utilsPrinting.printerCommands.push("PJ5001*");
    }

    if (payload) {
      this.utilsPrinting.printerCommands.push(
        "iF*" + payload.invoiceNumber.padStart(11, "0")
      );
      this.utilsPrinting.printerCommands.push("iD*" + payload.date);
      this.utilsPrinting.printerCommands.push("iI*" + payload.printerCode);
    }

    this.utilsPrinting.printerCommands.push("iR*" + (client.vat || "No tiene"));
    this.utilsPrinting.printerCommands.push("iS*" + client.name);

    this.utilsPrinting.printerCommands.push("i00Teléfono: " + (client.phone || "No tiene"));
    this.utilsPrinting.printerCommands.push("i01 Dirección: " + (client.street || "No tiene"));
    this.utilsPrinting.printerCommands.push("i02Email: " + (client.email || "No tiene"));
    if (this.order.name) {
      this.utilsPrinting.printerCommands.push("i03Ref: " + this.order.name);
    }
  },
  setTotal() {
    
    this.utilsPrinting.printerCommands.push("3");
    const aplicar_igtf = this.pos.config.aplicar_igtf;
    const isAboveThreshold = (amount) => amount > 0;
    //validar si todo en divisas
    var payment_amount = 0
    const es_nota = this.order
      .get_orderlines()
      .every(({ refunded_orderline_id }) => Boolean(refunded_orderline_id));
    console.log("es_nota", es_nota);
    if (es_nota) {
      if (
        this.order
          .get_paymentlines()
          .filter(({ amount }) => Boolean(amount < 0))
          .every(({ isForeignExchange }) => Boolean(isForeignExchange)) &&
          aplicar_igtf && this.order.sigtef
      ) {
        // this.utilsPrinting.printerCommands.push("122");
      } else {
        this.order
          .get_paymentlines()
          .filter(({ amount }) => Boolean(amount < 0))
          .forEach((payment, i, array) => {
            if (payment.amount < 0) {
              if (
                i + 1 === array.length &&
                this.order
                  .get_paymentlines()
                  .filter(({ amount }) => Boolean(amount < 0)).length === 1
              ) {
                this.utilsPrinting.printerCommands.push("1" + payment.x_printer_code);
                payment_amount += parseFloat(payment.amount)
              } else {
                const rate_ = Number(this.pos.config.show_currency_rate.toFixed(2)); 
                let amount = convert(payment.amount * rate_);
                payment_amount += parseFloat(payment.amount)

                amount = amount.split(",");
                amount[0] = Math.abs(amount[0]).toString();
                amount[0] =
                  this.pos.config.flag_21 === "30"
                    ? amount[0].padStart(15, "0")
                    : amount[0].padStart(10, "0");
                amount = amount.join("");
                this.utilsPrinting.printerCommands.push(
                  "2" + payment.x_printer_code + amount
                );
              }
            }
          });
      }
    } else {
      if (
        this.order
          .get_paymentlines()
          .filter(({ amount }) => Boolean(amount > 0))
          .every(({ isForeignExchange }) => Boolean(isForeignExchange)) &&
          aplicar_igtf && this.order.sigtef 
      ) {
        // this.utilsPrinting.printerCommands.push("122");
      } else {
        this.order
          .get_paymentlines()
          .filter(({ amount }) => Boolean(amount > 0))
          .forEach((payment, i, array) => {
            if (payment.amount > 0) {
              if (
                i + 1 === array.length &&
                this.order
                  .get_paymentlines()
                  .filter(({ amount }) => Boolean(amount > 0)).length === 1
              ) {
                this.utilsPrinting.printerCommands.push("1" + payment.x_printer_code);
                payment_amount += parseFloat(payment.amount)
              } else {
                const rate_ = Number(this.pos.config.show_currency_rate.toFixed(2)); 
                let amount = convert(payment.amount * rate_);
                payment_amount += parseFloat(payment.amount)

                amount = amount.split(",");
                amount[0] = Math.abs(amount[0]).toString();
                amount[0] =
                  this.pos.config.flag_21 === "30"
                    ? amount[0].padStart(15, "0")
                    : amount[0].padStart(10, "0");
                amount = amount.join("");
                this.utilsPrinting.printerCommands.push(
                  "2" + payment.x_printer_code + amount
                );
              }
            }
          });
      }
    }
   
    if (aplicar_igtf && this.order.sigtef) {
      this.utilsPrinting.printerCommands.push("i04Ref."+Number(payment_amount.toFixed(2)) +' BCV');
        this.utilsPrinting.printerCommands.push("i05Los cambios se realizan dentro de ");
        this.utilsPrinting.printerCommands.push("i06 7 días hábiles. Debe presentar ");
        this.utilsPrinting.printerCommands.push("i07obligatoriamente la factura.");
        this.utilsPrinting.printerCommands.push("i08 No se hace devolución de dinero.");
      this.utilsPrinting.printerCommands.push("199");
      
    } else {
        this.utilsPrinting.printerCommands.push("i04Ref."+Number(payment_amount.toFixed(2)) +' BCV');
        this.utilsPrinting.printerCommands.push("i05Los cambios se realizan dentro de ");
        this.utilsPrinting.printerCommands.push("i06 7 días hábiles. Debe presentar ");
        this.utilsPrinting.printerCommands.push("i07obligatoriamente la factura.");
        this.utilsPrinting.printerCommands.push("i08 No se hace devolución de dinero.");
        this.utilsPrinting.printerCommands.push("199");
    }
  },
  printFiscal() {
    this.setHeader();
    this.setLines("GF");
    this.setTotal();
  },

  setLines(char) {
    this.order
      .get_orderlines()
      .filter(({ x_is_igtf_line }) => !x_is_igtf_line)
      .forEach((line) => {
        console.log(line.get_price_without_tax())
        //let command = char + "+";
        let command = "";
        const taxes = line.get_taxes();

        if (
          !taxes.length ||
          taxes.every(({ x_tipo_alicuota }) => x_tipo_alicuota === "exento")
        ) {
          command += "";
          if (char === "GC") {
            command += "d0";
          } else {
            command += " ";
          }
        } else if (
          taxes.every(({ x_tipo_alicuota }) => x_tipo_alicuota === "general")
        ) {
          if (char === "GC") {
            command += "d1";
          } else {
            command += "!";
          }
        } else {
          if (char === "GC") {
            command += "d0";
          } else {
            command += " ";
          }
        }
        /*else if(taxes.every(({ x_tipo_alicuota }) => x_tipo_alicuota === "reducido")) {
                    command += "2";
                } else {
                    command += "3";
                }*/
        console.log(line.get_price_without_tax())
        const rate_ =Number(this.pos.config.show_currency_rate.toFixed(2));  
        var get_price_without_tax = ((line.get_price_without_tax() / line.quantity) * rate_)
        let amount = convert(get_price_without_tax ).split(",");
        // let amount = convert(
        //   line.get_price_without_tax() / line.quantity
        // ).split(",");
        let quantity = convert(Math.abs(line.quantity), 3).split(",");

        amount[0] =
          this.pos.config.flag_21 === "30"
            ? amount[0].padStart(14, "0")
            : amount[0].padStart(8, "0");
        quantity[0] =
          this.pos.config.flag_21 === "30"
            ? quantity[0].padStart(14, "0")
            : quantity[0].padStart(5, "0");

        amount = amount.join("");
        quantity = quantity.join("");

        command += amount;
        command += `${quantity}`;

        const { product } = line;

        if (product.default_code) {
          command += `|${product.default_code}|`;
        }

        command += product.display_name;

        this.utilsPrinting.printerCommands.push(command);
        //comando tester error
        //this.utilsPrinting.printerCommands.push('-' + command);

        if (line.discount > 0) {
          if (line.discount == 100) {
            let discount = convert(line.discount).split(",");
            discount = discount.join("");
            this.utilsPrinting.printerCommands.push("p-" + discount);
          } else {
            let amount = convert(
              line.get_price_without_tax() / line.quantity
            ).split(",");
            amount[0] =
              this.pos.config.flag_21 === "30"
                ? amount[0].padStart(15, "0")
                : amount[0].padStart(7, "0");
            amount = amount.join("");
            this.utilsPrinting.printerCommands.push("q-" + amount);
          }
        }

        if (line.customerNote) {
          if (char === "GC") {
            this.utilsPrinting.printerCommands.push(`A##${line.customerNote}##`);
          } else {
            this.utilsPrinting.printerCommands.push(`@##${line.customerNote}##`);
          }
        }
      });
  },
  printNoFiscal() {
    let totalQuantity = 0;
    const rate_ = Number(this.pos.config.show_currency_rate.toFixed(2));
    this.utilsPrinting.printerCommands.push(
      "80$                                  " 
    );
    
    this.order
      .get_orderlines()
      .filter(({ x_is_igtf_line }) => !x_is_igtf_line)
      .forEach((line) => {
        const { product } = line;
        
        // Mostrar nombre del producto
        this.utilsPrinting.printerCommands.push(
          `80  ${product.display_name} `
        );
        
        // Convertir el precio con impuestos de la línea
        const priceWithTax = line.get_price_with_tax();
        const convertedPrice = priceWithTax * rate_;  // Conversion a la moneda principal (por ejemplo, USD)
        
        // Convertir el precio unitario con impuestos
        const unitPriceWithTax = line.get_taxed_lst_unit_price();
        const convertedUnitPrice = unitPriceWithTax * rate_;  // Conversión del precio unitario

        // Imprimir la línea con la cantidad y los montos convertidos
        this.utilsPrinting.printerCommands.push(
          `80* ................................................"x${line.quantityStr} ${convert(convertedPrice)}`
        );
        totalQuantity += parseFloat(line.quantityStr); 
      });

    // Si hay un cambio, mostrarlo también con la conversión
    if (this.order.get_change()) {
      const change = this.order.get_change();
      const convertedChange = change * rate_;  // Conversión del cambio
      this.utilsPrinting.printerCommands.push(
        "80* CAMBIO:................................................" + convert(convertedChange)
      );
    }

    // Imprimir el total con impuestos convertido
    const totalWithTax = this.order.get_total_with_tax();
    const convertedTotal = totalWithTax * rate_;  // Conversión del total
    this.utilsPrinting.printerCommands.push(
      "80____________________________________________________________________" 
    );
    this.utilsPrinting.printerCommands.push(
      "80* TOTAL:                                                 " + convert(convertedTotal)
    );

    // Información adicional de la orden
    this.utilsPrinting.printerCommands.push("80* orden No. " + this.order.name);
    this.utilsPrinting.printerCommands.push("80* Cantidad de prendas." + Number(totalQuantity));
    this.utilsPrinting.printerCommands.push("80* Cajero:" +this.order.cashier.name+ '');
    this.utilsPrinting.printerCommands.push("80 Los cambios se realizan dentro de ");
    this.utilsPrinting.printerCommands.push("80 7 días hábiles. Debe presentar ");
    this.utilsPrinting.printerCommands.push("80 los productos en su empaque original.");
    this.utilsPrinting.printerCommands.push("80 No se hace devolución de dinero.");
    this.utilsPrinting.printerCommands.push(
      "80$                                  " 
    );
    this.utilsPrinting.printerCommands.push(
      "81" 
    );
  },

  async printNotaCredito() {
    const { confirmed, payload } = await this.popup.add(NotaCreditoPopUp, {});
    if (!confirmed) return false;
    this.setHeader(payload);
    this.setLines("GC");
    this.setTotal();

    return true;
  },
};







const printingMixingReprintReceipScreen = {
  setup() {
    super.setup();
    this.popup = useService("popup");
    this.utilsPrinting = new PrintingMixin(this.pos);
  },
  orderDone() {
    if (this.currentOrder.impresa) {
      this.pos.removeOrder(this.currentOrder);
      this._addNewOrder();
      const { name, props } = this.nextScreen;
      this.showScreen(name, props);
      if (this.pos.config.iface_customer_facing_display) {
        this.pos.send_current_order_to_customer_facing_display();
      }
    } 
    else {
      this.env.services.popup.add(ErrorPopup, {
        title: "Error",
        body: "Debe imprimir el documento fiscal",
      });
    }
  },
  get order() {
    return this.constructor.name === "ReprintReceiptScreen"
      ? this.props.order
      : this.pos.get_order();
  },
  async doPrinting(mode) {
    if (
      !this.order
        .get_paymentlines()
        .every(({ x_printer_code }) => Boolean(x_printer_code))
    ) {
      return this.pos.popup.add(ErrorPopup, {
        title: "Error",
        body: "Algunos métodos de pago no tienen código de impresora",
      });
      //return
    }
    if (this.order.impresa) {
      return this.pos.popup.add(ErrorPopup, {
        title: "Error",
        body: "Documento impreso en máquina fiscal",
      });
      //return;
    }
    this.utilsPrinting.printerCommands = [];
    switch (mode) {
      case "noFiscal":
        this.printNoFiscal();
        break;
      case "fiscal":
        this.read_s2 = true;
        this.printFiscal();
        break;
      case "notaCredito":
        this.read_s2 = true;
        const result = await this.printNotaCredito();
        if (!result) return;
        break;
    }
    if (this.pos.config.connection_type === "usb") {
      this.utilsPrinting.printViaUSB();
    } else if (this.pos.config.connection_type === "serial") {
      this.utilsPrinting.actionPrint();
    } else if (this.pos.config.connection_type === "usb_serial") {
      this.utilsPrinting.actionPrint();
    } else if (this.pos.config.connection_type === "api") {
      this.utilsPrinting.printViaApi();
    } else {
      this.utilsPrinting.actionPrint();
    }
  },
  setHeader(payload) {
    const client = this.order.partner;
    if (payload) {
      this.utilsPrinting.printerCommands.push(
        "iF*" + payload.invoiceNumber.padStart(11, "0")
      );
      this.utilsPrinting.printerCommands.push("iD*" + payload.date);
      this.utilsPrinting.printerCommands.push("iI*" + payload.printerCode);
    }

    this.utilsPrinting.printerCommands.push("iR*" + (client.vat || "No tiene"));
    this.utilsPrinting.printerCommands.push("iS*" + client.name);

    this.utilsPrinting.printerCommands.push("i00Teléfono: " + (client.phone || "No tiene"));
    this.utilsPrinting.printerCommands.push("i0 Dirección: " + (client.street || "No tiene"));
    this.utilsPrinting.printerCommands.push("i02Email: " + (client.email || "No tiene"));
    if (this.order.name) {
      this.utilsPrinting.printerCommands.push("i03Ref: " + this.order.name);
    }
  },
  setTotal() {
    this.utilsPrinting.printerCommands.push("3");
    const aplicar_igtf = this.pos.config.aplicar_igtf;
    const isAboveThreshold = (amount) => amount > 0;
    const es_nota = this.order
    const payment_amount = 0.0
      .get_orderlines()
      .every(({ refunded_orderline_id }) => Boolean(refunded_orderline_id));
    console.log("es_nota", es_nota);
    if (es_nota) {
      if (
        this.order
          .get_paymentlines()
          .filter(({ amount }) => Boolean(amount < 0))
          .every(({ isForeignExchange }) => Boolean(isForeignExchange)) &&
          aplicar_igtf && this.order.sigtef
      ) {
      } else {
        this.order
          .get_paymentlines()
          .filter(({ amount }) => Boolean(amount < 0))
          .forEach((payment, i, array) => {
            if (payment.amount < 0) {
              if (
                i + 1 === array.length &&
                this.order
                  .get_paymentlines()
                  .filter(({ amount }) => Boolean(amount < 0)).length === 1
              ) {
                this.utilsPrinting.printerCommands.push("1" + payment.x_printer_code);
              } else {
                const rate_ = Number(this.pos.config.show_currency_rate.toFixed(2)); 
                let amount = convert(payment.amount * rate_);

                amount = amount.split(",");
                amount[0] = Math.abs(amount[0]).toString();
                amount[0] =
                  this.pos.config.flag_21 === "30"
                    ? amount[0].padStart(15, "0")
                    : amount[0].padStart(10, "0");
                amount = amount.join("");
                this.utilsPrinting.printerCommands.push(
                  "2" + payment.x_printer_code + amount
                );
              }
            }
          });
      }
    } else {
      if (
        this.order
          .get_paymentlines()
          .filter(({ amount }) => Boolean(amount > 0))
          .every(({ isForeignExchange }) => Boolean(isForeignExchange)) &&
          aplicar_igtf && this.order.sigtef 
      ) {
      } else {
        this.order
          .get_paymentlines()
          .filter(({ amount }) => Boolean(amount > 0))
          .forEach((payment, i, array) => {
            if (payment.amount > 0) {
              if (
                i + 1 === array.length &&
                this.order
                  .get_paymentlines()
                  .filter(({ amount }) => Boolean(amount > 0)).length === 1
              ) {
                this.utilsPrinting.printerCommands.push("1" + payment.x_printer_code);
              } else {
                const rate_ = Number(this.pos.config.show_currency_rate.toFixed(2)); 
                let amount = convert(payment.amount * rate_);
                payment_amount = amount[0] = payment.amount;
                amount = amount.split(",");
                amount[0] = Math.abs(amount[0]).toString();
                amount[0] =
                  this.pos.config.flag_21 === "30"
                    ? amount[0].padStart(15, "0")
                    : amount[0].padStart(10, "0");
                amount = amount.join("");
                this.utilsPrinting.printerCommands.push(
                  "2" + payment.x_printer_code + amount
                );
              }
            }
          });
      }
    }
    
    if (aplicar_igtf && this.order.sigtef) {
      this.utilsPrinting.printerCommands.push("i04Ref."+Number(payment_amount.toFixed(2)) +' BCV');
        this.utilsPrinting.printerCommands.push("i05Los cambios se realizan dentro de ");
        this.utilsPrinting.printerCommands.push("i06 7 días hábiles. Debe presentar ");
        this.utilsPrinting.printerCommands.push("i07obligatoriamente la factura.");
        this.utilsPrinting.printerCommands.push("i08 No se hace devolución de dinero.");
      this.utilsPrinting.printerCommands.push("199");
      
    } else {
        this.utilsPrinting.printerCommands.push("i04Ref."+Number(payment.amount.toFixed(2)) +' BCV');
        this.utilsPrinting.printerCommands.push("i05Los cambios se realizan dentro de ");
        this.utilsPrinting.printerCommands.push("i06 7 días hábiles. Debe presentar ");
        this.utilsPrinting.printerCommands.push("i07obligatoriamente la factura.");
        this.utilsPrinting.printerCommands.push("i08 No se hace devolución de dinero.");
        this.utilsPrinting.printerCommands.push("199");
    }
        
    
  },
  printFiscal() {
    this.setHeader();
    this.setLines("GF");
    this.setTotal();
  },
  setLines(char) {
    this.order
      .get_orderlines()
      .filter(({ x_is_igtf_line }) => !x_is_igtf_line)
      .forEach((line) => {
        let command = "";
        const taxes = line.get_taxes();

        if (
          !taxes.length ||
          taxes.every(({ x_tipo_alicuota }) => x_tipo_alicuota === "exento")
        ) {
          command += "";
          if (char === "GC") {
            command += "d0";
          } else {
            command += " ";
          }
        } else if (
          taxes.every(({ x_tipo_alicuota }) => x_tipo_alicuota === "general")
        ) {
          if (char === "GC") {
            command += "d1";
          } else {
            command += "!";
          }
        } else {
          if (char === "GC") {
            command += "d0";
          } else {
            command += " ";
          }
        }
        const rate_ = Number(this.pos.config.show_currency_rate.toFixed(2));  
        var get_price_without_tax = ((line.get_price_without_tax() / line.quantity) * rate_)
        let amount = convert(get_price_without_tax ).split(",");          
        let quantity = convert(Math.abs(line.quantity), 3).split(",");

        amount[0] =
          this.pos.config.flag_21 === "30"
            ? amount[0].padStart(14, "0")
            : amount[0].padStart(8, "0");
        quantity[0] =
          this.pos.config.flag_21 === "30"
            ? quantity[0].padStart(14, "0")
            : quantity[0].padStart(5, "0");

        amount = amount.join("");
        quantity = quantity.join("");

        command += amount;
        command += `${quantity}`;

        const { product } = line;

        if (product.default_code) {
          command += `|${product.default_code}|`;
        }

        command += product.display_name;

        this.utilsPrinting.printerCommands.push(command);
        if (line.discount > 0) {
          if (line.discount == 100) {
            let discount = convert(line.discount).split(",");
            discount = discount.join("");
            this.utilsPrinting.printerCommands.push("p-" + discount);
          } else {
            let amount = convert(
              line.get_price_without_tax() / line.quantity
            ).split(",");
            amount[0] =
              this.pos.config.flag_21 === "30"
                ? amount[0].padStart(15, "0")
                : amount[0].padStart(7, "0");
            amount = amount.join("");
            this.utilsPrinting.printerCommands.push("q-" + amount);
          }
        }

        if (line.customerNote) {
          if (char === "GC") {
            this.utilsPrinting.printerCommands.push(`A##${line.customerNote}##`);
          } else {
            this.utilsPrinting.printerCommands.push(`@##${line.customerNote}##`);
          }
        }
      });
  },
  printNoFiscal() {
    this.order
      .get_orderlines()
      .filter(({ x_is_igtf_line }) => !x_is_igtf_line)
      .forEach((line) => {
        const { product } = line;
        this.utilsPrinting.printerCommands.push(
          `80 ${product.display_name} [${product.default_code}]`
        );
        this.utilsPrinting.printerCommands.push(
          `80*x${line.quantityStr} ${convert(
            line.get_price_with_tax()
          )} (${convert(line.get_taxed_lst_unit_price())} C/U)`
        );
      });
    if (this.order.get_change()) {
      this.utilsPrinting.printerCommands.push(
        "80*CAMBIO: " + convert(this.order.get_change())
      );
    }
    this.printerCommands.push(
      "81$TOTAL: " + convert(this.order.get_total_with_tax())
    );
    // this.utilsPrinting.printerCommands.push("80>Ref."+Number(payment.amount.toFixed(2)) +' BCV');
    //   this.utilsPrinting.printerCommands.push("80>Los cambios se realizan dentro de ");
    //   this.utilsPrinting.printerCommands.push("80> 7 días hábiles. Debe presentar ");
    //   this.utilsPrinting.printerCommands.push("80>hábiles.");
    //   this.utilsPrinting.printerCommands.push("80> No se hace devolución de dinero.");
  },
  async printNotaCredito() {
    const { confirmed, payload } = await this.popup.add(NotaCreditoPopUp, {});
    if (!confirmed) return false;
    this.setHeader(payload);
    this.setLines("GC");
    this.setTotal();

    return true;
  },
};

patch(ReceiptScreen.prototype, printingMixingReceipScreen);
patch(ReprintReceiptScreen.prototype, printingMixingReprintReceipScreen);
