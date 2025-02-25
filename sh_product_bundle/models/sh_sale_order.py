# Copyright (C) Softhealer Technologies.

from odoo import models, fields


class ShSaleOrder(models.Model):
    _inherit = 'sale.order'

    def action_bundle_product(self):
        if self:
            return {
                'name': 'Agregar paquete',
                'type': 'ir.actions.act_window',
                'view_type': 'form',
                'view_mode': 'form',
                'res_model': 'sh.product.bundle.wizard',
                'target': 'new',
                'context': {'default_sh_partner_id': self.partner_id.id, },
            }


class ShSaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    sh_bundle_id = fields.Many2one(
        'sh.product.bundle',
        string='Paquete',
        )
    
    def action_custom_function(self):
        pass
