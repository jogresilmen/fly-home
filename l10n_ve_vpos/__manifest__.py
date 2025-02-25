# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': "POS VPOS",
    'version': '0.1.1',
    'category': 'Sales/Point of Sale',
    'summary': 'Integración de POS con terminal VPOS',
    'description': '',
    'author': '@easyss_dev',
    'website': '',
    'sequence': 6,
    'instalable': True,
    'depends': ['point_of_sale'],
    'qweb': [],
    'assets': {
        'point_of_sale._assets_pos': [
            'l10n_ve_vpos/static/src/app/**/*',
            
            'l10n_ve_vpos/static/src/overrides/**/*',
        ],
        'web.assets_backend': [
            'l10n_ve_vpos/static/src/js/vpos_action_dialog.xml',
            'l10n_ve_vpos/static/src/js/pos_config_kanban_dropdown.js',
            ],
    },
    
    'data': [
        'security/ir.model.access.csv',
        'views/pos_config.xml',
        'views/point_of_sale_dashboard.xml',
        'views/res_config_settings_views.xml',
        'views/pos_payment_method_views.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'OPL-1',
}
