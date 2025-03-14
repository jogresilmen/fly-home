# -*- coding: utf-8 -*-
{
    'name': "quote_insurance_snippets",

    'summary': """
        Short (1 phrase/line) summary of the module's purpose, used as
        subtitle on modules listing or apps.openerp.com""",

    'description': """
        Long description of module's purpose
    """,

    'author': "My Company",
    'website': "https://www.yourcompany.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/16.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Uncategorized',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base','product'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/snippets_quote.xml',
        'views/views.xml',
        'views/templates.xml',
        'data/crons.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'quote_insurance_snippets/static/src/css/main.css',
            'quote_insurance_snippets/static/src/js/main.js',
            'quote_insurance_snippets/static/src/js/plan.js',
            
        ]
    },
}
