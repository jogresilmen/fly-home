from odoo import models, fields


class ResPartner(models.Model):
    _inherit = 'res.partner'

    municipality_id = fields.Many2one('res.municipality', string="Municipality")
    parish_id = fields.Many2one('res.parish', string="Parish")