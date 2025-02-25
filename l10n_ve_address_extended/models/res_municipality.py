from odoo import models, fields


class ResMunicipality(models.Model):
    _name = 'res.municipality'
    _description = 'Municipality'

    name = fields.Char(string='Name', required=True)
    state_id = fields.Many2one('res.country.state', string='State', required=True)
    country_id = fields.Many2one('res.country', string='Country', required=True)