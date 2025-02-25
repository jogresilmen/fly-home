from odoo import models, fields


class ResParish(models.Model):
    _name = 'res.parish'
    _description = 'Parish'

    name = fields.Char(string='Name', required=True)
    municipality_id = fields.Many2one('res.municipality', string='Municipality', required=True)
    country_id = fields.Many2one('res.country', string='Country', required=True)
    state_id = fields.Many2one(related='municipality_id.state_id', store=True)