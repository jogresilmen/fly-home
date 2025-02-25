# -*- coding: utf-8 -*-

from odoo import models, fields, api
import json


class quote_insurance_snippets(models.Model):
    _name = 'quote_insurance_snippets.quote_insurance_snippets'
    _description = 'quote_insurance_snippets.quote_insurance_snippets'

    
    def get_countries(self):
        country  = self.env['res.country'].sudo().search([])
        origin_country= []
        destination_country=[]
        for count in country:
            origin_country.append({"id": count.code, "name": count.name})
            destination_country.append({"id": count.code, "name": count.name})
        return {
            'origin_country': origin_country,
            'destination_country': destination_country
        }


        


class CustomUser(models.Model):
    _inherit = 'res.users'

    fee = fields.Boolean(string='Fee')
    operation_type = fields.Selection([('discount', 'Descuento'),('increase', 'Incremento')],
                                      string='Tipo De Operación')
    type_discount = fields.Selection([('fixed', 'Fijo'),('percentage', 'Porcentual')],
                                     string='Tipo de Descuento')
    operation = fields.Float(string='Monto')