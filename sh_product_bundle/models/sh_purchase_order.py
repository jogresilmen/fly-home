# Copyright (C) Softhealer Technologies.

from odoo import models


class ShPurchaseOrder(models.Model):
    _inherit = 'purchase.order'

    def action_bundle_product(self):
        if self:
            return {
                'name': 'Agregar Paquete',
                'type': 'ir.actions.act_window',
                'view_type': 'form',
                'view_mode': 'form',
                'res_model': 'sh.product.bundle.wizard',
                'target': 'new',
                'context': {'default_sh_partner_id': self.partner_id.id, },
            }
