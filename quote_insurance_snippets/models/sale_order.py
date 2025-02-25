from odoo import models, fields, api




class SaleOrderAges(models.Model):
    _name = 'sale.order.ages'

    name = fields.Char(string='Grupo edad')
    ages_init = fields.Integer(string='Edad desde')
    ages_end = fields.Integer(string='Edad Hasta')
    operation_type = fields.Selection([('discount', 'Descuento'),('increase', 'Incremento')],string='Tipo De Operación')
    type_discount = fields.Selection([('fixed', 'Fijo'),('percentage', 'Porcentual')],string='Tipo de Descuento')
    operation = fields.Float(string='Monto')
    



    
    
class SaleOrder(models.TransientModel):
    _name= 'sale.order.temp'

    quote_details = fields.Char()
    name = fields.Char(string='')
    origin_country = fields.Char(string='')
    destination = fields.Char(string='')
    departure_date = fields.Char(string='')
    return_date = fields.Char(string='')
    travelers_count = fields.Char(string='')
    email_address = fields.Char(string='')
    mobile_number = fields.Char(string='')
    trip_type = fields.Char(string='')
   
    
