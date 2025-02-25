/** @odoo-module */

import { register_payment_method } from "@point_of_sale/app/store/pos_store";
import { PaymentVpos } from "@l10n_ve_vpos/app/payment_vpos";

register_payment_method("vpos", PaymentVpos);

