# -*- coding: utf-8 -*-
{
    'name': 'Venezuela: POS IGTF',
    'version': '17.0.1.2.0',
    'author': 'Easy Solutions Service',
    'company': 'Easy Solutions Service',
    'maintainer': 'Easy Solutions Service',
    'website': 'willians.tafur@easysolutionsservice.com',
    'category': 'Sales/Point of Sale',
    'summary': 'IGTF en el POS',
    'depends': ['point_of_sale','l10n_ve_pos_dual_currency'],
    'data': [
        'views/inherited_views.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'pos_igtf_tax/static/src/scss/**/*',
            'pos_igtf_tax/static/src/xml/**/*',
            'pos_igtf_tax/static/src/js/**/*',
        ],
    },
    'license': 'LGPL-3',
}
