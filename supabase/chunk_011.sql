-- Bulk import of all remaining legacy clients
INSERT INTO public.legacy_clients (
    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
    logo, logo_altura, logo_largura, auto_size
) VALUES
(948, 'LICAFÉ - COM. IMP. E EXP. DE CAFÉ LTDA', 'LICAFE', 'RUA DO COMÉRCIO DO CAFÉ', '35', 'SALA 03', NULL, 'VARGINHA', 'VARGINHA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '36.398.923/0004-33', NULL, '001.008.920-0004', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1722, 'Lofbergs Baltic SIA', 'Lofbergs Baltic SIA', 'Ziemelu iela 53, Kekava, Kekavas pag.', NULL, 'Kekavas nov., LV-2123', NULL, 'Latvia', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'Bank
Svenska Handelsbanken AB Latvijas filiale
Bank code
HANDLV22
Account
LV57HAND0008300006052 (EUR)
LV94HAND0008300006065 (USD)
VAT LV40003830061


Lofbergs baltic SIA informs, that as of March 29th, 2021, 
the legal address and the location address of Lofbergs Baltic SIA is:

ZIEMELU IELA 53,
KEKAVA, KEKAVAS PAG., KEKAVAS NOV.
LV-2123 - LATVIA

Please note, our location haven''t change, changes made only
in the address.', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1050, 'LOFBERGS LILA AB', NULL, 'HAMNTORGET - PO BOX 1501S-651 21 KARLSTAD - SWEDEN', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '(46) 54186542', NULL, NULL, NULL, NULL, 'I���\u0000q��sָ?�*P�<mH�V��N�ɧo^ڔ���G�F\u001aX̑�+F:������''�\u0000�{��A\u0010�?�{�\u0000���\u0013�\u001eH4;d��[y�����\u001e?�\u0016\u001d��=+C����M\u000ft�6-�\u001f9�\u0002@\u001f�\u0000W�>0�pK\u0019얲�������v4T\u001b�-ϛ\u0018\u0010H �:�0E\u0015��\u001e\u0005�6������w�<��<rO<q\u0019\u0007�y\u0001�${�!���=��j��Zܨ\u0007�n�� �\b��=+�py�\u001b\u0017e\t���i4�2i��\u0015��xG�\u001a�\u0002�K�����FX��b3�S��\u0007��E�{�KJ�;d妉�UA�J���j�\u0000�p���{H�v�W��p�v��Emh�\u0017���i.4}<�A\u001c�[2�\u0018��\u001c`�z\u0011V!�W�''�e��I��0�yA�0���\/�d�g4��)�\tԊkyi뮂�9�+���\u001e$�T����<˛`�b''�ˋ# \u00193��g5<�\u000f|Y\u0014�\u000f�;H�\t\r\u0014�:����*%����Gk�Km�aٳ���5�\f�Z\u0004\u0011Ϭ؛8�m�ZX�N3�\u0013ڮ�^\u0004�6�l�\u0016�K�\u0012\f��\u0012�\u000e��\u0003\u0010j��#MUuc���+}����j����)�xz\u0018��', 'J', 'CL', 'CO', NULL, 'LOFBERGS LILA AB
LOFBERGS
TONY BROMAN


Lofbergs Lila A.B
Hamntorget – PO Box 1501
651 21 Karlstad
Sweden
info@lofbergslila.se <info@lofbergslila.se>
 
tel. 020 98 5779
fax. 054 140135


BANK

Kaffehuset i Karlstad AB 
Organisation number: 556657-9578, 
IBAN: SE5860000000000049743619, 
SWIFT: HANDSESS.
(Handelsbanken, Tingvallag. 17, 651 11 Karlstad, Sweden).', NULL, NULL, NULL, true, NULL, 12, '����\u0000\u0010JFIF\u0000\u0001\u0001\u0001\u0001', NULL, NULL, false),
(1172, 'LOUIS DREYFUS COMMODITIES BRASIL S/A', 'DREYFUS', 'ROD. MIGUEL CURRY CARNEIRO', '1023', NULL, 'VOLTA ESCURA', 'NOVA VENECIA', NULL, 'ES', '29830-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, '47.067.525/0170-00', NULL, '082.461.08-2', true, 2, 2, NULL, NULL, NULL, NULL),
(1321, 'Louis Dreyfus Company Brasil S/A', 'Louis Dreyfus Company Brasil S/A', 'Rua do Comércio', '18/20', NULL, NULL, 'Santos', NULL, 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, '47.067.525/0006-12', '135234', '633.011.540.113', true, 2, 2, NULL, NULL, NULL, NULL),
(774, 'LUIZ BRAZ E OUTROS', 'LUIZ BRAZ', 'FAZENDA CAMPO BELO', NULL, NULL, NULL, 'SERRA DO SALITRE', 'SERRA DO SALITRE', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CO', 'CO', NULL, NULL, NULL, '090.207.489.04', 'PR-667/1632', true, NULL, NULL, NULL, NULL, NULL, NULL),
(380, 'LUIZ CLAUDIO DE ABREU COSTA COFFEE TRADING & AGENC', NULL, 'AV. NOSSA SENHORA DOS NAVEGANTES', '675', 'SALA 1104', 'ENSEADA DO SUÁ', 'VITÓRIA', 'VITÓRIA', 'ES', '29.056-900', '(27) 3258132', NULL, '(27) 2276654', NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO:', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(63, 'M C KINLAY', 'M C KINLAY', 'RUA FREI GASPAR', '22', 'CJ 43', 'CENTRO', 'SANTOS', 'SANTOS', 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO:', '33.179.714/0002-49', NULL, '633.068.807.118', true, NULL, NULL, NULL, NULL, NULL, NULL),
(898, 'M.B.R. COMERCIO EXPORTAÇÃO CAFÉ LTDA', 'MBR', 'RUA GIACOMINA DE FELIPPI', '1895', NULL, NULL, 'ESP. STO DO PINHAL', 'ESP. STO DO PINHAL', 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '56.139.389/0001-05', NULL, '530.015.394-115', true, NULL, NULL, NULL, NULL, NULL, NULL),
(150, 'MACSOL S/A MANUFATURA DE CAFÉ SOLÚVEL', NULL, 'BR 369 ROD. MELO PEIXOTO', 'KM 87,5', NULL, NULL, 'CORNÉLIO PROCÓP', 'CORNÉLIO PROCÓP', 'PR', NULL, '(43) 5242591', NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO: MARUBENI', '55.793.376/0001-92', NULL, '901.227.2500', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1491, 'Maison P. Jobin & Cie S.A.S', 'Maison P. Jobin & Cie SAS', 'Océane Building 2,', 'Avenue Foch', 'CS 50095', NULL, '76050 Le Havre, France', NULL, NULL, NULL, '(33) 235 193525', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'Old Address:
169 Boulevard de Strasbourg,
Le Havre 76600, France
(33) 235 193525

New Address (Aug 28th, 2017):
OCÉANE BIULDING. 2, AVENUE FOCH - CS 50095
LE HAVRE
76050
FRANCE
LILIAN MORIN
33 2  35 19 35 25 

Bank Remittance (Aug 29th, 2017):
NATIXIS 
Portefeuille Etranger 
3, rue Necker (ex rue de l''Entrepôt)
94220 CHARENTON LE PONT (France)
Tél: (+33) 1 58 32 23 39', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(102, 'MARCA CAFE COM. EXPORTACAO S/A', NULL, 'RUA FREI GASPAR', '20', NULL, 'CENTRO', 'SANTOS', 'SANTOS', 'SP', NULL, '2195800', NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO:', '32.483.711/0005-84', NULL, '633.268.578.113', false, NULL, NULL, NULL, NULL, NULL, NULL),
(27, 'MARCA CAFE COM. EXPORTACAO S/A', NULL, 'RUA PONTAL', NULL, NULL, 'DIST. INDUSTRIAL', 'ELOI MENDES', 'ELOI MENDES', 'MG', NULL, '(35) 2641043', NULL, '(35) 2641042', NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'CONTATO:', '32.483.711/0006-65', NULL, '236.645.657/0041', true, NULL, NULL, NULL, NULL, NULL, NULL),
(377, 'MARCA CAFE COM. EXPORTACAO S/A', NULL, 'AV. N.S. DOS NAVEGANTES', '675', 'CJ 1200A', 'ENSEADA DO SUÁ', 'VITÓRIA', 'VITÓRIA', 'ES', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'CONTATO:', '32.483.711/0001-50', NULL, '081.289.18-09', true, NULL, NULL, NULL, NULL, NULL, NULL),
(751, 'MARCELLINO MARTINS & E.JOHNSTON EXP. LTDA', 'MARCELLINO', 'AV. PRES. TANCREDO NEVES,', '1474-C', NULL, NULL, 'CARATINGA', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '33.729.690/0018-11', NULL, '134.262.043.0102', true, NULL, NULL, NULL, NULL, NULL, NULL),
(760, 'MARCELLINO MARTINS & E.JOHNSTON EXP. LTDA', 'MARCELLINO', 'RUA XV DE NOVEMBRO', '46', NULL, NULL, 'SANTOS', 'SANTOS', 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '33.729.690/0001-73', NULL, '633.037.975.110', false, NULL, NULL, NULL, NULL, NULL, NULL),
(665, 'MARCELLINO MARTINS & E.JOHNSTON EXPORTADORES LTDA', 'MARCELLINO', 'RUA MARIA NAZARETH PRADO', '225', NULL, NULL, 'VARGINHA', 'VARGINHA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '33.729.690/0005-05', NULL, '236.262.043.0096', false, NULL, NULL, NULL, NULL, NULL, NULL),
(496, 'MARKUS WIRTH', 'MARKUS WIRTH', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1167, 'Marubeni Corporation - Tokyo Head Office', 'Marubeni Corporation - Tokyo', '4-2 Ohtemachi 1-Chome', '100-8088', 'Chiyoda-Ku', NULL, NULL, 'Japan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1367, 'Meinl Capital Advisors AG', 'Meinl Capital Advisors', 'Bauernmarkt 2,', NULL, 'A-1010', NULL, 'Vienna, Austria', NULL, NULL, NULL, '43 1 531 88 75', NULL, '43 1 531 88', NULL, NULL, 'coffee.desk@meinlbank.com / attn. Mrs. Cornelia Seyfried', 'J', 'CL', 'CO', NULL, 'Contact: Mrs. Beatrice Brandenberger

Meinl Capital Advisors 
Bauernmarkt 2
A-1010 Vienna

Bank coordinates: 
***Depends, Please check S/I.***

[ITALIA]
Julius Meinl Italia
Via Verona 70
I-36077 Altavilla Vicentina (VI)
ITALIA
Attn. Mr. Andreas Karanikolas

[AUSTRIA]
Julius Meinl Austria
Julius Meinl Gasse 3-7
A-1160 Vienna
AUSTRIA
Attn. Mr. Koller', NULL, NULL, NULL, true, 7, 15, NULL, NULL, NULL, NULL),
(160, 'MELITTA DO BRASIL IND. E COM. LTDA', 'MELITA', 'ROD. SALIN ANTONIO CURIATI, 245', 'KM 05', NULL, NULL, 'AVARÉ', 'AVARÉ', 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO: CLAUDIO', '62.000.278/0011-98', NULL, '194.017.144-110', true, NULL, NULL, NULL, NULL, NULL, NULL),
(947, 'MELITTA DO BRASIL INDUSTRIA E COMÉRCIO LTDA', 'MELITTA', 'AV. GETÚLIO VARGAS', '1750', NULL, NULL, 'BOM JESUS', 'BOM JESUS', 'RS', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '62.000.278/0013-50', NULL, '011/0024010', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1210, 'Melna Kafija', 'Melna Kafija', 'Veccsili, Kekavas Parish, Kekavas district,', 'LV-2123', NULL, NULL, 'Riga,', 'Latvia', NULL, NULL, '+37167100912', NULL, NULL, '+37129223053', NULL, 'vladimir.gorbatih@melnakafija.lv', 'J', 'CL', 'CO', NULL, 'Contact person: Mr. Vladimir Gorbatih

VAT No.: LV40003830061

Melna Kafija.
Veccsili, Kekavas Parish, Kekavas district,
LV-2123 - Riga, Latvia


No bank information.
Sent in trust upon payment.


ANDZEJS: 28/12 SAMPLES TO KARLSTAD ONLY!!!', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1060, 'MERCURY TRADING VENTURES CO. LIMITED', 'MERCURY', 'P.O. BOX 958 - PASEA ESTATE, ROAD TOWN', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(870, 'MINAS COMISSARIA DE CAFÉ LTDA', 'MINAS', 'Alameda do Café', '219', 'sala 3', NULL, 'Varginha', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'CO', NULL, NULL, '66.312.414/0001-64', NULL, NULL, true, NULL, 2, NULL, NULL, NULL, NULL),
(291, 'MINAS EXPORT LTDA', 'MINAS', 'RUA SIQUEIRA CAMPOS', '274', NULL, NULL, 'PIUMHI', 'PIUMHI', 'MG', '37925-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'MINAS EXPORT LTDA

JR Assessoria Intermediacao e Corretagem Ltda
Rua XV de novembro, 41 conj 40
Santos - S.Paulo
CNPJ 64.721517/0001-52
IE Isenta
Insc. Municipal  100362-5

Descontar 3% de ISS 

OBS: NOVO ENDEREÇO: Av.Querobino Mourão Filho, 
643 -B.Bela Vista - Cep: 37.925-000 - Piumhi/MG.', '01313.864/0001-26', NULL, '515.980.175.0027', true, NULL, 4, NULL, NULL, NULL, NULL),
(1073, 'Mitsui & Co., Ltd. (USA)', 'Mitsui ( USA )', 'Foodstuff Departament (NYCPP) Foods Division.', '200', 'Park Avenue', NULL, 'New York -', 'NY', NULL, '10166-130', NULL, NULL, NULL, NULL, NULL, '\u0011ܴ����\t\u001bd��0��p*���oO�c��K(�\u0004�1��l�����~\u0019����O��|5r��g�[�o�aWl���`\u0013]\/��~\f�\u0013��\\�\u0000�ƪu*����߅ĩ���Es��4[�n���\u0006��H\u000b\u001c�\u0011�d$�\u0004�F��*����+\rMl\/\u001e�\u001b�����6\u0011�1݅>�\u0015\u0007�?�n�?��\u001f�\u0018*_\u001c1\u0019넜�{7?�3Z�S��[X�*<�e�{��χ��5x�m�Q\"�ב\u0019\u001dI�UCd���s���\u0000�D��\u0000����**��\u0013�F\r\u0003����\u0000�RW���\u001f�\"_�\u0000�JO�\u0015\u0015y�����S�Vu҂�Y�\u001f4�5�\u0000<\u0011\u0016��I�j\"E��e��Q�K.sϰ���y\u0015{o�_\u001bc���\u0011ۛp��f\u001bd&]�\u0019QHc�\u001c�\u001c�v�]��?b�71�({Uϱ���V^�}e�X�jZ����0\u001aY\u001c��ۧ�8�;�w��\/\u0003K\u0005�����T\u0012', 'J', 'CL', 'CO', NULL, 'Message received on Feb 23rd, 2010:

Here are our contact:
 
35 Maple Street, Norwood, NJ 07648, US
Coffee Division
Mitsui Foods, Inc.
tel: +1-201-750-2811
group e-mail: CoffeeNJFDS@dg.mitsui.com
 
PF at above hot line (primary person in charge: Nancy Jiang), preferably e-mail to above group address as evidence; US working days from 8:00 am to 3:00 pm EST.

Our preference is for the shipper to present documents in trust directly to our office in New Jersey.  


Mitsui Foods, Inc. 
35 Maple Street
Norwood, NJ 07648
Attn.:  Coffee Department 

 
Message received on Oct 18th, 2010
Instructions for original docs remittance (Mitsui USA):

If shipper wishes to present documents on a collections basis, please advise shipper that all bank charges including our charges will be for the account of the shipper. 

Present documents to: 

Citigroup
3800 Citigroup Center  Building B
3rd Floor
Tampa, Florida  33610
Attn: Import collections department phone 813-604-7047

Present to:  Mitsui Foods, Inc. 

In order not to delay payment, please make sure it is clearly stated that bank charges will be for the account of the Drawer.', NULL, NULL, NULL, false, NULL, 15, '����\u0000\u0010JFIF\u0000\u0001\u0001\u0001\u0001', NULL, NULL, false),
(783, 'MITSUI ALIMENTOS LTDA', 'MITSUI', 'ROD. PRES. CASTELO BRANCO', 'KM 49', NULL, NULL, 'ARAÇARIGUAMA', 'ARAÇARIGUAMA', 'SP', NULL, NULL, NULL, NULL, NULL, NULL, '\u0011ܴ����\t\u001bd��0��p*���oO�c��K(�\u0004�1��l�����~\u0019����O��|5r��g�[�o�aWl���`\u0013]\/��~\f�\u0013��\\�\u0000�ƪu*����߅ĩ���Es��4[�n���\u0006��H\u000b\u001c�\u0011�d$�\u0004�F��*����+\rMl\/\u001e�\u001b�����6\u0011�1݅>�\u0015\u0007�?�n�?��\u001f�\u0018*_\u001c1\u0019넜�{7?�3Z�S��[X�*<�e�{��χ��5x�m�Q\"�ב\u0019\u001dI�UCd���s���\u0000�D��\u0000����**��\u0013�F\r\u0003����\u0000�RW���\u001f�\"_�\u0000�JO�\u0015\u0015y�����S�Vu҂�Y�\u001f4�5�\u0000<\u0011\u0016��I�j\"E��e��Q�K.sϰ���y\u0015{o�_\u001bc���\u0011ۛp��f\u001bd&]�\u0019QHc�\u001c�\u001c�v�]��?b�71�({Uϱ���V^�}e�X�jZ����0\u001aY\u001c��ۧ�8�;�w��\/\u0003K\u0005�����T\u0012', 'J', 'CL', 'CO', NULL, NULL, '58.128.190/0043-66', NULL, '743.000.808.119', false, NULL, 2, '����\u0000\u0010JFIF\u0000\u0001\u0001\u0001\u0001', NULL, NULL, false),
(682, 'MOKA TRADING COMPANY LTDA', 'MOKA', 'RUA ARMANDO VIOTTI', '260', NULL, NULL, 'PIUMHI', 'PIUMHI', 'MG', '37925-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'J.R.Assessoria,Interm.Corretagens Ltda         
Rua XV de Novembro, 41 cj. 40  Santos 
Cep: 11010-151                           

CNPJ: 64.721.517/0001-52
Inscrição Isento :isento', '23.591.589/0001-45', NULL, '515.078.079.0094', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1634, 'Mood Masters', 'Mood Masters', '7770 Al Mutanabbi', NULL, '12831,2265, Al Malaz- Riyadh', NULL, 'Saudi Arabia', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, ':: Mood Masters, Mr. Meshari
7770 Al Mutanabbi Al Mutanabbi,
12831,2265, Al Malaz- Riyadh, Saudi Arabia', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1352, 'Morecoffee Comercio Exportação de Cafe ltda', 'Morecoffee Comercio Exportação de Cafe ltda', 'Avenida Prefeito Lessa', '370', NULL, 'centro', 'Esp. Santo do Pinhal', NULL, 'SP', '13990-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, '66.074.378/0002-29', NULL, '530038358115', true, 2, 2, NULL, NULL, NULL, NULL),
(1081, 'Mountain Coffee Corporation', 'Mountain Coffee', '6971 W Sunrise Blvd Suite # 104', NULL, 'Plantation', 'FL 33313 USA', 'Florida -', 'USA', NULL, NULL, '+1-954-990-7428', NULL, '+1-480-275-3878', NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, '(Message received on January 08th, 2011)            
Effective as of January 10, 2011 Mountain Coffee Corporation, a division of Atlantica Exportação e Importação Ltda (Brazil) will be established to the following address:

MOUNTAIN COFFEE CORPORATION
6971 W Sunrise Blvd Suite # 104
Plantation, FL 33313 USA
Phone +1-954-990-7428
Fax +1-480-275-3878
E-mail: coffee@mountaincoffeecorp.com


Contacts:
Marco Figueiredo - marco@mountaincoffeecorp.com - Cell. 954-600-4364
Waldimir Sousa – wally@mountaincoffeecorp.com - Cell. 954-600-4369
Bruno Tavares – bruno@mountaincoffeecorp.com

Documents should be sent to Mountain Coffee "in trust" or presented to our bank at your expense through:

Bank of America, Trade Services
1 Fleet Way / MAILPA6-580-01-30
Scranton, PA 18507-1999 USA
Tel.++1-570-330-4236', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1527, 'MTC International Coffee Group Limited', 'MTC International Coffee Group Limited', 'No. 16-18 Hing Yip Street, Kwun Tong', 'Factory A6, 11/F', 'Block A, Mai Hing Industrial Building,', NULL, 'Kowloon, Hong Kong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1307, 'N.J. Douek & Sons', 'N.J. Douek & Sons', '407 McGill St. Suite 809', NULL, NULL, NULL, 'Montreal - Quebec', NULL, NULL, 'H2Y 2G3', '1-514-845-9173', NULL, '1-514-845-8110', NULL, NULL, 'info@njdouek.com', 'J', 'CL', 'CO', NULL, 'Mr. Phil Douek
philip@njdouek.com
Mr. Raoul Douek
raoul@njdouek.com
Mrs. Daisy Douek
daisy@njdouek.com

Bank collection information is as follows (2014, May 1st):
 
National Bank Of Canada
Service International
600 La Gauchetiere Ouest
5th Floor 
Montreal, Quebec
H3B 4L3, Canada.', NULL, NULL, NULL, true, 7, 15, NULL, NULL, NULL, NULL),
(1375, 'N.V. Supremo S.A.', 'N.V. Supremo S.A.', 'Oosterlingenplein 4A,', NULL, NULL, NULL, '8000 Brugge, Belgium', NULL, NULL, NULL, '32 0 50442060', NULL, NULL, NULL, NULL, 'coffee@supremo.be', 'J', 'RE', 'CO', NULL, 'Message received from buyer on June 29th, 2015:

"We strongly recommend all our suppliers to send the document in TRUST
to our office: N.V. Supremo S.A. Oosterlingenplein 4A, 8000 Brugge, Belgium.
If you do choose for a doc.col. please note you can send the docs to the KBC Bank, 
Documentary Collections Division, BHI-BRUhav2, Havenlaan 2, 1080 Brussel Belgium.
In this case please do not forget to deduct or add any outstanding debit and/ or credit notes
and instruct the bank that all costs for this collection will be for the account of the seller."', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(253, 'NAUMANN GEPP COMERCIAL E EXPORTADORA LTDA', 'NAUM', 'AV. PRESIDENTE WENCESLAU BRAZ', '2600', NULL, NULL, 'POÇOS DE CALDAS', 'POÇOS DE CALDAS', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO:', '65.396.699/0002-87', NULL, '518.686.410.0078', true, NULL, NULL, NULL, NULL, NULL, NULL),
(255, 'NAUMANN GEPP COMERCIAL E EXPORTADORA LTDA', 'NAUMANN', 'RUA XV DE NOVEMBRO', '53', NULL, NULL, 'SANTOS', 'SANTOS', 'SP', NULL, '2194311', NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO:', '65.396.699/0001-04', NULL, '633.281.644.110', true, NULL, NULL, NULL, NULL, NULL, NULL),
(691, 'NESTLE - BRAZIL NQCC', 'NESTLE', 'Avenida Dr. Chucri Zaidan,', '246', NULL, NULL, 'SAO PAULO', 'SAO PAULO', 'SP', '04583-110', '(11)5508-8598', NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, 2, NULL, NULL, NULL, NULL),
(1509, 'Nestrade S.A', 'Nestrade S.A', 'Menara Ken, No. 37, Jalan Burhanuddin Helmi', NULL, 'Taman Tun Dr Ismail, 6000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Hiroyuki.Nakanishi@my.nestle.com', 'J', 'CL', 'CO', NULL, 'Mr. Hiro Nakanishi (Zoegas)

Hiroyuki.Nakanishi@my.nestle.com', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(141, 'NHA BENTA IND. DE ALIMENTOS LTDA', 'NHA BENTA', 'ESTRADA DOS CASAS', '707', NULL, NULL, 'SÃO BERNARDO DO CAMPO', 'SÃO BERNARDO DO CAMPO', 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO: JR(SANTOS', '59.114.587/0001-02', NULL, '635.002.539-119', true, NULL, NULL, NULL, NULL, NULL, NULL),
(952, 'NICCHIO  CAFÉ S/A EXP. E IMPORTAÇÃO', 'NICCHIO', 'RUA SUELI DAMASCENO', '31 A', NULL, NULL, 'MANHUMIRIM', 'MANHUMIRIM', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '27.127.579/0007-62', NULL, '395.988.976-0180', true, NULL, NULL, NULL, NULL, NULL, NULL),
(497, 'NILO BRANCO', 'NILO BRANCO', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(256, 'NKG STOCKLER LTDA', 'ST', 'RUA CARLOS MUMIC', '52', NULL, NULL, 'S.S. DO PARAISO', 'S.S. DO PARAISO', 'MG', '37950-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO:', '61.620.753/0002-75', NULL, '432.374.185.0059', true, NULL, 2, NULL, NULL, NULL, NULL),
(1547, 'NKG STOCKLER LTDA', 'STOCKLER COMERCIAL E EXPORTADORA LTDA', 'Rod. MG 111 - Km 99', 'sala 1', 'Zona Rural', NULL, 'Manhumirim', NULL, 'MG', '36.970-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, '61.620.753/0015-90', NULL, '432.374.185-0547', true, 2, 2, NULL, NULL, NULL, NULL),
(565, 'NKG STOCKLER LTDA', 'STOCKLER', 'AV. RIO BRANCO', '43', NULL, NULL, 'RIO DE JANEIRO', 'RIO DE JANEIRO', 'RJ', '20090-003', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '61.620.753/0011-66', NULL, '85.430.351', true, NULL, 2, NULL, NULL, NULL, NULL),
(1627, 'NKG STOCKLER LTDA', 'NKG STOCKLER LTDA', 'Rod. Candido Portinari', 'KM 407', NULL, NULL, 'Franca', NULL, 'SP', '14.414-899', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, '61.620.753/0014-09', NULL, '310.280.268.117', true, 2, 2, NULL, NULL, NULL, NULL),
(1866, 'NKG STOCKLER LTDA', 'NKG STOCKLER LTDA', 'Avenida Princesa do Sul, 2365', NULL, NULL, NULL, 'Varginha', NULL, 'MG', '37062-180', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, '61.620.753/0012-47', NULL, '707.374.185-0110', true, 2, 2, NULL, NULL, NULL, NULL),
(755, 'NKG Stockler LTDA (Varginha)', 'STOCKLER VARGINHA', 'Av. José Ribeiro Tristão, 105', NULL, NULL, NULL, 'Varginha', NULL, 'MG', '37031-075', '(13) 3213-8200', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'Endereço: Av. José Ribeiro Tristão, 105 
Aeroporto, Varginha - MG, 37030-840', '61.620.753/0016-70', NULL, '432.374.185-0628', true, NULL, 2, NULL, NULL, NULL, NULL),
(145, 'NOSSA SENHORA DA GUIA - ARMAZÉNS GERAIS LTDA', NULL, 'RUA GETÚLIO VARGAS', '1648', NULL, 'SANTO ANTONIO', 'PIUMHI', 'PIUMHI', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO: AÉCIO', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1217, 'ODEBRECHT COM. IND. DE CAFÉ LTDA', 'ODEBRECHT', 'Av. Rio de Janeiro,', '221', '2º andar', NULL, 'Londrina', NULL, 'PR', '86.010-918', '(43)33244612', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'CONTATO: LUIS', '78.597.150/0001-11', NULL, '601.01550-19', true, 2, 2, NULL, NULL, NULL, NULL);
