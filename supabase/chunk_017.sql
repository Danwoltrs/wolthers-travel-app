-- Bulk import of all remaining legacy clients
INSERT INTO public.legacy_clients (
    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
    logo, logo_altura, logo_largura, auto_size
) VALUES
(1372, 'Rothfos Corporation', 'Rothfos Corp.', 'River Street', '111', 'Suite 1220', NULL, 'Hoboken', NULL, 'NJ', '07030 USA', '+1 646 556 8400', NULL, '+1 646 924 3720', NULL, NULL, 'coffee@rothfos.com', 'J', 'CL', 'CV', NULL, 'Rothfos Corporation


****New Address (07/08/2019)****
Rothfos Corporation
111 River Street, Suite 1220
Hoboken, NJ  07030
Main Tel:  (646)556-8400 

****Old Address****
1 Penn Plaza Suite 2222
New York, NY 10119
Tel: +1 646 556-8401
Fax: +1 646 556-8415
E mail: coffee@rothfos.com

Olaf Syrdahl, Trading Manager
EXT. 8407
E-MAIL: olaf.syrdahl@nkg.coffee', NULL, NULL, NULL, true, 7, 21, NULL, NULL, NULL, NULL),
(1441, 'RPM Warehouse HQ', 'RPM Warehouse', '2900 Woodbridge Avenue,', NULL, NULL, NULL, 'Edison, NJ 08837', NULL, NULL, NULL, '(201) 823-5200', NULL, '(732) 205-8292', NULL, NULL, NULL, 'J', NULL, 'CV', NULL, 'RPM Warehouse
2900 Woodbridge Avenue,
Edison, NJ 08837', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(946, 'SAGRADOS CORAÇÕES IND. E COM. DE ALIMENTOS LTDA', 'SAGRADOS', 'ROD. BR 381 - KM 754', NULL, NULL, NULL, 'TRÊS CORAÇÕES', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'MINAS COMISSARIA', '65.123.804/0001-23', NULL, '693.744.704-0000', true, NULL, 2, NULL, NULL, NULL, NULL),
(1101, 'Sagrados Corações Ind. e Com. de Alimentos Ltda.', 'Sagrados Corações', 'Rod. Fernando Dias, KM 754 - BR 381', NULL, NULL, 'Distrito Industrial', 'Três Corações', NULL, 'MG', '37410-000', '35 3239-5251', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'CEP.: 37410-000', '65.123.804/0001-23', NULL, '693.744.704-0000', true, NULL, 2, NULL, NULL, NULL, NULL),
(1571, 'Sanmiguel Cia Colombiana Agricola SAS', 'Sanmiguel Cia Colombiana Agricola SAS', 'Cra 48 No 6-159 Interior 39', NULL, NULL, NULL, 'Neiva, Huila - Colombia', NULL, NULL, NULL, '+57 8 8648989', '(+57) (8) 864 8', NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Shipper: Sanmiguel Cia Colombiana Agricola SAS
              Cra 48 No 6-159 Interior 39
              Neiva, Huila, (Colombia)
              (+57) (8) 864 89 89

Emails: colagrosangerencia@gmail.com
            Tatiana.sanmiguel.trading@gmail.com', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1594, 'SANTO ALEIXO EMPREENDIMENTOS AGROPECUARIOS LTDA', 'GRUPO SANTO ALEIXO', 'RUA  ARAXA', '25', NULL, 'DIST INDUSTRIAL J.H.DA SILVA', 'ARAXA', NULL, 'MG', '38180-305', '034-3662 1381', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '73.198.574/0007-85', NULL, '002026516.04-56', true, 9, 2, NULL, NULL, NULL, NULL),
(1826, 'SELECTA CAFES DO BRASIL LTDA', 'SELECTA CAFES DO BRASIL LTDA', 'Alameda do Café', '252B', NULL, NULL, 'Varginha', NULL, 'MG', '37026-400', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'NETUZZI
PRATA PEREIRA', '37.837.362/0001-41', NULL, '37897240096', true, 2, 2, NULL, NULL, NULL, NULL),
(1191, 'SMC - COMERCIAL E EXPORTADORA DE CAFÉ S/A', 'SMC', 'ALAMEDA DIONISIO GUEDES BARRETO - ROD.SP 207 KM 01', 'S/N', NULL, NULL, 'SAO JOSE DO RIO PARDO', NULL, 'SP', '13720-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '10.966.025/0004-40', NULL, '646.047.380.110', true, 2, 2, NULL, NULL, NULL, NULL),
(970, 'SMC Comercial e Exp. de Café S/A', 'SMC - ARMAZEM', 'Av. Vereador Nelson Elias,', '1300 A', NULL, 'Japy', 'Guaxupe', NULL, 'MG', '37800-000', '35 35597955', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, '28/Abril/2014

Peço por gentileza que nas próximas notas faturar para SMC Matriz, segue dados:

SMC Comercial e Exportadora de Café S/A
CNPJ: 10.966.025/0001-06
IE: 001285680 0041
Rua Professor José de Sá, 38 - Centro
Guaxupé-MG.
Cep.: 37800-000', '10.966.025/0005-21', NULL, '001285680 0203', true, NULL, 2, NULL, NULL, NULL, NULL),
(1530, 'SMC Comercial e Exportadora de Café S/A', 'SMC - ESCRITORIO', 'Rua Professor José de Sá, 38', NULL, NULL, NULL, 'Centro - Guaxupe, MG', NULL, NULL, '37800-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '10.966.025/0001-06', NULL, '001285680-0041', true, 2, 7, NULL, NULL, NULL, NULL),
(1332, 'Starcontinental Pte Ltd.', 'Starcontinental Pte Ltd.', '24 Raffles Place #13-02 -', NULL, NULL, NULL, NULL, 'Singapore', NULL, '048621', '+6566727041', NULL, NULL, NULL, NULL, 'jn@starcontinental.net', 'J', 'CL', 'CV', 'DHL 962700181', 'Contact: Mr. Jens Nielsen
Mobile: +6590300132

Bank Details as of Oct 8th, 2014:

DBS BANK LTD
12 Marina Boulevard
Hex.12-01 Marina Bay Financial Centre Tower 3,
Singapore 018982
Attn: Trade services Department
Tel: +65 6878 8881  and  +65 6878 8882', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1870, 'StoneX Switzerland SA', 'StoneX Switzerland SA', 'Avenue du Theatre 1, 1005', NULL, 'Lausanne, Switzerland', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Seller:
StoneX Switzerland SA
Avenue du Theatre 1, 1005 Lausanne, Switzerland
(Avenue du Théâtre 1, 1005 Lausanne, Switzerland)
Tél : +41 (0) 21 561 11 49

luciano.gonzalez@stonex.com
raphael.morais@stonex.com
bruno.felipe@stonex.com', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1733, 'Subo International, Dba. Maverick Coffee Trading.', 'Subo International', 'Nieuwegracht 6, 2nd Floor', NULL, '3512 LP - Utrecht', NULL, 'The Netherlands', NULL, NULL, NULL, '+31 30 274 5715', NULL, NULL, NULL, NULL, 'w.hobby@maverickcoffeetrading.com', 'J', 'CL', 'CV', '+31 (0) 6 5252 6009
info@subo-international.com', 'Subo International, Dba. Maverick Coffee Trading 
Nieuwegracht 6, 2nd Floor
3512 LP - Utrecht
The Netherlands
Contact: Mr. Will Hobby', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1496, 'Sucafina Brasil Industria, Comércio e Exportação LTDA', 'SUCAFINA BRASIL INDÚSTRIA, COMÉRCIO E EXPORTAÇÃO LTDA', 'ROD BR 491 Varginha -  Eloi Mendes', NULL, NULL, NULL, 'Santa Luiza, Varginha - MG', NULL, NULL, '37030-087', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'SUCAFINA BRASIL
Rua: Quinze de Novembro, 59 - 2° Andar - Centro 
CEP: 11010-151, Santos - São Paulo, Brasil
T:+55 13 3213 1460 | M: +55 13 9 9737 7710', '07.146.352/0003-60', NULL, '707.996.036-0068', true, 2, 2, NULL, NULL, NULL, NULL),
(1569, 'Sucafina Colombia S.A.S.', 'Sucafina Colombia', 'Carrera 14 # 94-44, Oficina 501B', NULL, NULL, NULL, 'Bogotá, Colombia', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'SUCAFINA COLOMBIA S.A.S.
Address: Carrera 14 # 94-44, Oficina 501B. 
Bogotá, Colombia

Phone: +571 746 6001
E-mail: sucafinacolombia@sucafina.com
Web: www.sucafina.com', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1532, 'Sucafina NA Inc.', 'SUCAFINA NA INC.', '109 North 12 St.', NULL, 'Suite 602', 'Brooklyn,', 'New York', 'NY 11249', NULL, 'USA', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'OLD ADDRESS UP TO 13/09/2021:
Sucafina NA Inc.
140 East 57th Street,
NY 10022 New York, USA

NEW ADDRESS FOR DOCUMENTS ONLY 06/12/2021
Sucafina NA - Fort Lauderdale, Florida
Attn: Quality Control
2780 E Oakland Park Blvd
Fort Lauderdale, FL 33306
UNIT 1 - BACKDOOR

PSS (all shippers except Cooxupe)
Sucafina Santos

PSS (Cooxupé)
Sucafina NA - Fort Lauderdale, Florida
Attn: Quality Control
2780 E Oakland Park Blvd
Fort Lauderdale, FL 33306

BANK COLLECTION (12/01/2024)

ING Bank N.V., Amsterdam, Lancy/Geneva branch 
ING Wholesale Banking 
8-10 Avenue des Morgines 
1213 Petit - Lancy, Geneva,Switzerland 
+41 22 592 30 57 
Attn to BP.T4 - Oulfa Charfi / Roland Aeby 
Swift code : BBRUCHGTXXX', NULL, NULL, NULL, true, 7, 26, NULL, NULL, NULL, NULL),
(1164, 'Sucafina S.A.', 'Sucafina', '1, Place ST Gervais', 'CP5425', NULL, '1211 Geneva 11,', NULL, 'Switzerland', NULL, NULL, '41 22 839 77 77', NULL, '41 22 702 92 02', NULL, 'www.sucafina.com', '��X`��I\"�9\\+���vÜ�m�\u001fJ�g�\u0001�S\u0007�OZ�\u0002xLxo^񥆊�L�������\n�@�C\u00001�\u001d\\c��`|:�<K�sE��', 'J', 'CL', 'CV', NULL, 'Contact.: Mr. Jean Heylen
jeanheylen1@gmail.com; xf@sucafina.ch

Alistair Sequira
als@sucafina.ch', NULL, NULL, NULL, true, 7, 7, '����\u0000\u0010JFIF\u0000\u0001\u0001\u0001\u0000`\u0000`\u0000\u0000��\u0000C\u0000\u0006\u0004\u0005\u0006\u0005\u0004\u0006\u0006\u0005\u0006\u0007\u0007\u0006\b\n\u0010\n\n\t\t\n\u0014\u000e\u000f\f\u0010\u0017\u0014\u0018\u0018\u0017\u0014\u0016\u0016\u001a\u001d%\u001f\u001a\u001b#\u001c\u0016\u0016', NULL, NULL, false),
(1818, 'Sucafina UK Limited', 'Sucafina UK', 'Corinthian House, 17', NULL, 'Lansdowne Road, Croydon', NULL, NULL, 'CR0 2BX, United Kingdom', NULL, NULL, '442074038787', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'Andrew Marshall
Head of Green Coffee Trading', '14/12/2023
Any logistics/shipping matters, please share to the following email ID''s 
and they will respond to you, by all means feel free to copy me in as well:

inbounduk@sucafina.com
executionuk@sucafina.com

Please send PSS to Croydon at least 500g per container and thanks to advise tracking number:

Sucafina UK
Corinthian house, 17 Lansdowne Road,
Croydon CR0 2BX, UK
Att. QA Team
Tel. +44(0)2074038787', NULL, NULL, NULL, true, 19, 26, NULL, NULL, NULL, NULL),
(1726, 'Sucden Coffee Netherlands B.V.', 'Sucden Coffee Netherlands B.V.', 'De Ruijterkade 113-2', NULL, '1011 AB Amsterdam - The Netherlands', NULL, NULL, NULL, NULL, NULL, '31 (0)202352500', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Sucden Coffee Netherlands B.V.
De Ruijterkade 113-2
1011 AB Amsterdam - The Netherlands
Register Amsterdam: 34213702 
VAT: NL8137.86.368.B01', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(202, 'Sumatra - Comércio Exterior Ltda.', 'Sumatra', 'Av. João Pinheiro, 6.410', NULL, NULL, 'Bordolan', 'Poços de Caldas', NULL, 'MG', '34402-392', '(35) 3729 3000', NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CV', NULL, 'CONTATO:

19 3661-9900

 DHL 654323423', '31.235.518/0006-42', NULL, '518.348.963.0054', true, NULL, 2, NULL, NULL, NULL, NULL),
(60, 'Sumatra Comércio Exterior Ltda.', 'Sumatra', 'Rodovia SP 342 - Km 204', NULL, NULL, NULL, 'Espíto Santo do Pinhal, Brazil', NULL, 'SP', '13990-000', '(19) 3661 9900', NULL, '(19) 3661 9902', NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'CONTATO: Augusto Souza

SUMATRA COMÉRCIO EXTERIOR LTDA.
Rodovia SP 342 - Km 204 Caixa Postal 131
Espírito Santo do Pinhal
CNPJ 31.235.518/0011-00       IE - 530.012.697.113

DHL 654323423', '31.235.518/0011-00', NULL, '530.012.697.113', true, NULL, 7, NULL, NULL, NULL, NULL),
(1790, 'Syngenta AVC SA', 'Syngenta AVC SA (CH)', 'Avenue de Miremont 12A', NULL, '1206 Genève', NULL, 'CHE-248.524.219', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Jun 1st, 2023:

Company: Syngenta AVC SA
Address: Avenue de Miremont 12A, 1206 Genève
Register Number: CHE-248.524.219

Bank Information:
UBS - Account number: 835835
Bank Agency: 0230
IBAN Code: CH270023023083583560Z', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1427, 'Syngenta Crop. Protection S.A. (Panamá)', 'Syngenta Crop. Protection S.A. (Panamá)', 'Avenida La Rotonda, Bladex Building, 12th Floor', 'Business Park Costa del Este', NULL, NULL, 'Panama, Republic of Panama', NULL, NULL, NULL, '(507) 270-8200', NULL, '(507) 270-8288', NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Syngenta Crop. Protection S.A.
R.U.C. 53906-2-329422 D. V. 80, 3987 Key
Business Park Costa del Este
Avenida La Rotonda
Edificio Bladex, Piso 12
Ciudad de Panamá, República de Panamá
Teléfono: (507) 270-8200
Fax: (507) 270-8288
Apartado 832-0063 WTC, Panamá', 'RUC 53906-2-329422', NULL, NULL, true, 7, 15, NULL, NULL, NULL, NULL),
(1833, 'TABATINGA  COMERCIO DE CAFE LTDA', 'CAFE TABATINGA', 'RUA ALCINO JOSE DE ARAUJO', '580', 'SALA 01', 'CENTRO', 'SAO FRANCISCO DE PAULA', 'BRAZIL', 'MG', '35543000', '37 99814-0143', '37 99966-6283', NULL, NULL, 'LOGISTICA@TABATINGA COFFEE.COM.BR', 'FINANCEIRO@TABATINGACOFFEE.COM.BR;MARKETING@TABATINGA .COM.BR', 'J', 'CL', 'CV', NULL, NULL, '34.875.218/0001-01', NULL, '003544686.00-63', true, 9, 9, NULL, NULL, NULL, NULL),
(1123, 'TANGARA IMPORTADORA E EXPORTADORA LTDA', 'TANGARA', 'Alameda dos Nhambiquara,', '1518', 'sala 71 e 72', 'Indianapolis', 'São Paulo', NULL, 'SP', '04090-003', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'TANGARA IMP. E EXP. S/A.
CNPJ: 39.787.056/0007-69
I.E.: 707.000848.0169
END.: RUA GUILHERME FRANCISCO ZANATELLI, Nº 110
BAIRRO SANTA LUIZA   -    VARGINHA/MG
CEP: 37026-653

Favor emitir nf para Tangara Sao Paulo

TANGARA IMPORTADORA E EXPORTADORA S/A      
ALAMEDA DOS NHAMBIQUARAS, 1.518
7AND SL.71/72     
INDIANOPOLIS
CEP 04090-003
CNPJ 39.787.056/0010-64    
Inscricao Estadual 149.345.457.112', '39.787.056/0010-64', NULL, '149.345.457.112', true, NULL, 4, NULL, NULL, NULL, NULL),
(957, 'TERRA FORTE EXP. E IMP. DE CAFÉ LTDA', 'TERRA FORTE', 'ROD. GERALDO MARTINS COSTA', 'S/N', 'KM 25', NULL, 'POÇOS DE CALDAS', NULL, 'MG', '37718-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '07.805.743/0004-20', NULL, '518.998.275.0156', true, NULL, 2, NULL, NULL, NULL, NULL),
(1502, 'TESTE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'MG', '36900-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, NULL, NULL, NULL, false, 2, 15, NULL, NULL, NULL, NULL),
(1090, 'The Mild Coffee Company', NULL, 'Bijdorp 2, 1181 MZ Amstelveen / 1180 AN Amstelveen', NULL, 'P.O. Box 552', NULL, NULL, NULL, NULL, NULL, '31 20 426 0140', NULL, '31 20 426 0145', NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Contact Person:
Mrs. Jantien Rutte
jantien@mildcoffee.nl


Bank Instructions:
e-mail received on January 04th, 2011

ABN AMRO BANK N.V.
Commodities Agri Amsterdam
PRINS BERNHARDPLEIN 200
1097 JB  AMSTERDAM
NETHERLANDS

ACCOUNT 21.37.58.172
SWIFTCODE: FTSBNL2R
IBAN: NL44FTSB0213758172', NULL, NULL, NULL, true, NULL, 7, NULL, NULL, NULL, NULL),
(1743, 'Touton S.A.', 'Touton S.A.', '1 Rue René Magne, Cidex 13', NULL, 'Centre Commercial de Gros Bordeaux Nord', NULL, '33083 Bordeaux, France', NULL, NULL, NULL, '+33 556 69 3369', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'Patrick de Boussac, Touton CEO', 'TOUTON S.A.
1 RUE RENE MAGNE-CIDEX 13
CENTRE CIAL. DE GROS BORDEAUX NORD
(Centre Commercial de Gros Bordeaux Nord)
33083 BORDEAUX CEDEX - FRANCE

TOUTON S.A.
1 RUE RENE MAGNE - CIDEX 13
CENTRE CIAL. DE GROS BORDEAUX NORD
33083 BORDEAUX CEDEX
FRANCE', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1182, 'TRÊS CORAÇÕES ALIMENTOS S.A.', 'TRÊS CORAÇÕES ALIMENTOS S.A.', 'Rodovia BR 101 Km10,5', 's/n', 'Quadras 04 e 05 – lote 140', NULL, 'Natal', NULL, 'RN', '59115-001', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '63.310.411/0014-18', NULL, '20.080.907-5', true, 2, 2, NULL, NULL, NULL, NULL),
(1092, 'Tristão International', NULL, '20 Hill Street,', NULL, 'Ground Floor', 'St Mary''s Court,', 'Douglas,', 'Isle of Man, UK', NULL, 'IM1 1EU', '44 (0) 1624 699', NULL, NULL, NULL, NULL, NULL, 'J', NULL, 'CV', NULL, NULL, NULL, NULL, NULL, true, NULL, 15, NULL, NULL, NULL, NULL),
(68, 'Unicafé - Cia. de Comércio Exterior.', 'Unicafé', 'Rua do Comércio,', 'n º 41', NULL, 'Centro', 'Santos -', 'CEP 11010-141', 'SP', NULL, '(13) 2102-8787', NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CV', NULL, 'UNICAFÉ - Santos
Rua do Comércio, 41 - Centro
Santos - SP
CEP 11010-141
tel. (13) 2102-8787

UNICAFE COMPANHIA DE COMERCIO EXTERIOR
AVENIDA ERNESTO CANAL 155,ALVORADA, VILA VELHA,
ESPIRITO SANTOS, BRASIL - CEP:29117-120
CNPJ: 28.154.680/0001-17

Correspondent Bank (field 56): Bank of America N.A. - New York, USA - Swift: BOFAUS3N. Account: 6550921296.
Beneficiary Bank (field 57): Banco Bradesco S/A - São Paulo, Brazil. Swift: BBDEBRSPSPO.
Final Beneficiary (field 59): IBAN: BR72 6074 6948 0351 1000 0023 108C 1
UNICAFE COMPANHIA DE COMERCIO EXTERIOR. Branch: 3511. Account: 2310-8.', '28.154.680/0003-89', '3922-0', '633.058.244.115', true, NULL, 7, NULL, NULL, NULL, NULL),
(1301, 'Volcafe LTD.', 'Volcafe CH', 'Technoparkstrasse 7,', NULL, 'CH-8406 Winterthur', NULL, NULL, '- Switzerland', NULL, NULL, '41 52 264 94 94', NULL, '41 52 264 94 00', NULL, NULL, NULL, 'J', NULL, 'CV', NULL, 'Documents in Trust (2019.07.11)
ED&F Man Commodities India Pvt Ltd
Incubex, M2 Block,  North Avenue, Level 13
Manyata Business Park, Outer Ring Road, Nagavara
Bangalore- 560045, India
Attn: Sukumaran Janardhan

Bank Collection (2019.07.11):

Dated.: January 09th, 2015
Our headoffice moved.
The new address is :
VOLCAFE LTD
VOLCAFE LTD
MEMBER OF ED&F MAN COFFEE DIVISION
Technoparkstrasse 7, CH-8406 Winterthur
Mail: P.O.Box 2514, CH-8401 Winterthur
Telephone +41 (0)52 264 94 94 / Telefax +41 (0)52 264 94 00
E-Mail volcafe@volcafe.ch / Internet www.volcafe.com
V.A.T. CHE-111.738.369 MWST
Mr. Berend Langelaar', NULL, NULL, NULL, true, 7, 15, NULL, NULL, NULL, NULL),
(1280, 'Webcor Group', 'Webcor S.A.', 'Route de L´Etraz - Bat A4', NULL, NULL, NULL, 'Rolle', 'Switzerland', NULL, 'CH-1180', '+41 22 906 76 4', NULL, NULL, NULL, 'coffee.switzerland@webcorgroup.com', 'ragnar@gctrading.ch', 'J', NULL, 'CV', NULL, 'Ragnar Wetterblad', NULL, NULL, NULL, true, 12, 12, NULL, NULL, NULL, NULL),
(1130, 'Wolthers America, Inc.', 'Wolthers America', '2880 SW 23rd Terrace', NULL, 'Suite 104', NULL, 'Fort Lauderdale, FL 33312', 'U.S.A', NULL, NULL, '954 707 0078', NULL, '954 321 9266', NULL, NULL, 'm{]3����T��\u0000ƖC�\u0013��nGk���+�ֵ-<}��\u0000\u0004�HԐ�HLl\u0010�V��������ׇS7���\u001d\u001d��[�\u001c.�ᛘ��Ie0�\u000f���\u0013◄�VD��[9��Y^����''��\u0003^_�W����\u0004M\u0002>x� ���z짝I|G<�轙�S$��\u001b\u0006F\u0019\u0004w�R�\u001f����M���$���N�N�>\\o���2\n����\u0014�\u001b\u0012���O�c\u0007\u0006��8�\u0000���z�3Z5tn�⫂�\u0003ٳFk+C�t�j�.��Ȯ�<f3��\u0011�\u001fcZj��\u0006�5%-��f>�(�\u0003��7x��\u001d����_\u0012�2��N��xi1�21�Fx�y���\\�7\t�\u001f\u0006]��%\u0017���\u0010��wIn\u000f�{��<s�^I$Z}N=O�\/��W|\u0004��', 'J', 'CL', 'CV', NULL, 'Endereço antigo:

500 SE 15th Street
Suite 118
Fort Lauderdale, FL 33316 U.S.A', NULL, NULL, NULL, false, NULL, 2, '����\u0000\u0010JFIF\u0000\u0001\u0001\u0001\u0000`\u0000`\u0000\u0000��\u0000C\u0000\u0006\u0004\u0005\u0006\u0005\u0004\u0006\u0006\u0005\u0006\u0007\u0007\u0006\b\n\u0010\n\n\t\t\n\u0014\u000e\u000f\f\u0010\u0017\u0014\u0018\u0018\u0017\u0014\u0016\u0016\u001a\u001d%\u001f\u001a\u001b#\u001c\u0016\u0016', NULL, NULL, false),
(1788, 'WOLTHERS COFFEE CORRETORA DE CAFÉ LTDA', 'WOLTHERS COFFEE CORRETORA DE CAFÉ LTDA', 'Rua XV de Novembro', '96', NULL, NULL, 'Santos', NULL, 'SP', '11010-150', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'CV', NULL, 'BANCO BRADESCO
AG: 2200
C/C: 48.506-3', '33.840.733/0001-93', NULL, NULL, true, 2, 2, NULL, NULL, NULL, NULL),
(1300, 'Wolthers Douqué, LLC.', 'Wolthers Douqué LLC, USA.', 'Fort Lauderdale, FL-33335', NULL, 'United States', NULL, 'PO Box 21043', NULL, NULL, NULL, '954-797-0078', NULL, '954-321-9266', NULL, NULL, NULL, 'J', 'CL', 'CV', 'Wolthers Douque, LLC
1627 S Andrews ave.
Fort Lauderdale, FL 33316
Phone 954-797-0078', 'Since February 3rd, 2014
Message received on July 15th, 2015:
Note: All documents to be sent to broker, address below.
OHL International
1825 NW 87 Ave.
Miami, Fl. 33172
General Ph: (305) 471-0071
 --------------
ITL USA Inc.(new address as of June 1st, 2018.)
915 West Huron Street
Suite # C104
Chicago, IL 60642
ITL USA Inc. (new address as of Feb 26th, 2018.
3030 South Atlantic Blvd
Vernon, CA 90058
Ph: (949) 336-4825

!!!DON''T USE ITL AS OF July 23rd, 2018!!!!!
Wolthers Douqué LLC, USA.
500 S.E. 15th St. Suite# 118
Fort Lauderdale, FL 33316
+1 954-797-0078
----------
novo endereço a partir de Ago/23
Wolthers Douque, LLC
1627 S Andrews ave.
Fort Lauderdale, FL 33316
----------
novo endereço a partir de Dec/24
Wolthers Douqué, LLC.
Fort Lauderdale, FL-33335
United States
PO Box 21043', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1338, 'Wolthers-Vittrup & Associates SA (Colombia)', 'Wolthers-Vittrup & Associates SA', 'Carrera 18', '78-74', 'Of. 708', NULL, 'Bogota', 'Colombia', NULL, NULL, '57 1 6364429', NULL, NULL, NULL, NULL, 'Office@WolthersColombia.com', 'J', 'RE', 'CV', NULL, NULL, NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1339, 'Wolthers-Vittrup & Associates SA (Guatemala)', 'Wolthers-Vittrup & Associates SA', 'Ave. Reforma 12-01 Zona 10', 'Of. 902', 'Edif. Reforma Montufar', NULL, 'Guatemala City', 'Guatemala', NULL, NULL, '502 2331-7822', NULL, NULL, NULL, NULL, 'Office@wolthersguatemala.com', 'J', 'RE', 'CV', NULL, NULL, NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(538, 'A.G. FONSECA E CIA LTDA', 'A.G.FONSECA', 'AV. BRASIL', '1027', NULL, NULL, 'CAMBIRA', 'CAMBIRA', 'PR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'SH', NULL, NULL, '03.824.798/0001-84', NULL, '902.16474-00', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1151, 'AIDC Tecnologia Ltda', 'AIDC Tecnologia Ltda', 'Av. Princresa do Sul', '470', 'Jardim Andere', 'Jardim Andere', 'Varginha', NULL, 'MG', '37062-180', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, 'Interway Coffee Division

Contact.: Marcos Ikeda



End. p/envio da NF: 
AIDC Tecnologia Ltda (Matriz)
End.:Rua Oswaldo Cruz, 567-Bairro: Varginha; Itajubá-MG; CEP: 37.501-168
A/C: Vanessa Souza ou Clarice Santos (Depto Financeiro).', '07.500.596/0002-19', '17.959', '324.356.378.0178', true, 7, 4, NULL, NULL, NULL, NULL),
(1464, 'ALFREDO JESUS  MITIO NAKAO', 'ALFREDO JESUS  MITIO NAKAO', 'Faz. Catanduva - BR 365 Km 370', NULL, NULL, NULL, 'Patos de Minas', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'SH', 'DATA NASCIMENTO: 03/10/1965
Alfredo: fazendacatanduva@hotmail.com', 'CORRETOR: PAULINHO', NULL, '070.630.858-16', '001321848-0116', true, 2, 2, NULL, NULL, NULL, NULL),
(990, 'ALTO CAFEZAL COM.IMP.E EXP. LT', 'ALTO CAFEZAL', 'RUA FIO GERMANO', '264', NULL, 'CONSTANTINO', 'Patrocinio', NULL, 'MG', '38740-000', '(34) 383133838', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, NULL, '03.280.627/0001-31', NULL, '481.034.857.0010', true, NULL, 7, NULL, NULL, NULL, NULL),
(1128, 'Bourbon Specialty Coffees S/A', 'Bourbon Specialty Coffees', 'Av. Presidente Wenceslau Braz', '2600', 'sala 7', 'Parque Primavera', 'Poços de Caldas', NULL, 'MG', '37706-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, NULL, '03.586.538/0007-03', NULL, '518.060.373.02-93', true, NULL, 7, NULL, NULL, NULL, NULL),
(1846, 'Brascof LTDA', 'BRASCOF LTDA', 'ROD BR-491 Varginha-Três Corações S/N KM 16.2', NULL, NULL, NULL, 'Varginha - MG', NULL, NULL, '37.062-195', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, 'Brascof Ltda
Rod BR 491, Varginha - Três Corações s/n Km 16 Rezende
CEP: 37062-195
(35) 3677-8505
Varginha / MG', '54.628.906/0001-84', NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1686, 'CAMILA COUTO DOMINGOS', 'CAMILA COUTO DOMINGOS', 'Faz. Domingos Couto', NULL, NULL, NULL, 'Campos Altos', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'SH', NULL, 'NILSON', NULL, '109.843.906-69', '003.791.531-0046', true, 2, 2, NULL, NULL, NULL, NULL),
(1100, 'CAZARINI TRADING COMPANY', 'cazarini', 'RUA  JOÃO URBANO FIGUEIREDO,', '365', NULL, 'PARQUE BOAVISTA', 'VARGINHA', 'BRASIL', 'MG', '37014-510', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'SH', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1433, 'COFCO International Brasil S.A', 'COFCO International Brasil S.A', 'Rodovia BR 491, KM 174', '5005', 'sala 4', 'Estiva', 'Alfenas', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, NULL, '08.963.419/00015-50', NULL, '105.846.300-00', true, 7, 2, NULL, NULL, NULL, NULL),
(1125, 'COFCO INTERNATIONAL COM. E ARMAZENAGEM DE GRÃOS LTDA', 'COFCO INTERNATIONAL COM. E ARMAZENAGEM DE GRÃOS LTDA', 'Rod. BR 491 (Alfenas/Areado),', 'Km 174 nº 5.005', NULL, NULL, 'Alfenas', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, '\u0001�Fk\u000b��n��-��[�9?ҽt�8��\u0017�W��尯\u0019T����ݚ��E�Rz���붅�\u0013���ls.�����]�k�o�o\u0010I~��8e�\u000f\u0015��8�5aЌ���\\B�gJ;E��yY�\u0017\u0007\u0019������Þ\u001f��W�)�iZ�y�Rj���\u0013\u0013��\u001b�p~�\u0015���\u001e\r�t\u0004е-\u0016�\u000b\u0006��h''��B$�.A�@z�=j��\u000by����%x%\u0011�GS;���LWe�dC', 'J', 'CL', 'SH', NULL, NULL, '08.963.419/0001-50', NULL, '001.058.463/0000', true, NULL, 2, '����\u0000\u0010JFIF\u0000\u0001\u0001\u0001\u0000`\u0000`\u0000\u0000��\u0000C\u0000\u0006\u0004\u0005\u0006\u0005\u0004\u0006\u0006\u0005\u0006\u0007\u0007\u0006\b\n\u0010\n\n\t\t\n\u0014\u000e\u000f\f\u0010\u0017\u0014\u0018\u0018\u0017\u0014\u0016\u0016\u001a\u001d%\u001f\u001a\u001b#\u001c\u0016\u0016', NULL, NULL, false),
(1122, 'Columbia Trading S/A', 'Columbia Trading', 'Av. Brigadeiro Faria Lima', '1485', '8° andar', 'Jardim Paulistano', 'São Paulo', 'Brazil', 'SP', '01452-002', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, 'FDA Registration # (optional)	19103281026', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL);
