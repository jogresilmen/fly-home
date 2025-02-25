from odoo import models, fields, api


class ProductSintomasCobertura(models.Model):
    _name = 'sale.travel'

    name = fields.Char(string='Nombre', required=True)
    operation_type = fields.Selection([('origin', 'Origen'),('destination', 'Destino'),('both', 'Ambos')],string='Tipo De Operación')
    currency_id = fields.Many2one('res.currency', string='Currency', required=True, default=lambda self: self.env.user.company_id.currency_id.id)
    origen = fields.Monetary(currency_field='currency_id',string='Costo en Origen',required=True, default=0)
    destination = fields.Monetary(currency_field='currency_id',string='Costo en destino', required=True,default=0)
    status = fields.Boolean(string='Estatus')
