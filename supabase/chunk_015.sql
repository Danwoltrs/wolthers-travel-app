-- Bulk import of all remaining legacy clients
INSERT INTO public.legacy_clients (
    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
    logo, logo_altura, logo_largura, auto_size
) VALUES
(1731, 'CAFFEIRA SAO JOAO LTDA', 'CAFEEIRA SAO JOAO', 'AV SAO JOAO', '106', NULL, NULL, 'MATIPO', 'BRASIL', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '16812331/0001-66', NULL, '409 323 338 0010', true, 9, 9, NULL, NULL, NULL, NULL),
(1560, 'CAMILA BORGES DE MELO', 'CAMILA BORGES DE MELO', 'FAZ MORRO DA MESA', 'S/N', NULL, 'ZONA RURAL', 'ARAXA', 'BRASIL', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'CV', NULL, NULL, '071 677 286-83', NULL, '0027271840028', true, 9, 9, NULL, NULL, NULL, NULL),
(1836, 'Capal Cooperativa Agroindustrial', 'CAPAL COOPERATIVA AGROINDUSTRIAL', 'Rua Joaquim Franco da Silva, 317', NULL, 'Zona Industrial - Pirajú/SP', NULL, '18810-818', NULL, NULL, NULL, '(14) 3351-9477', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'Seller contact:
portalcorretoradecafe@hotmail.com
gutocfsouza@gmail.com', 'Capal Cooperativa Agroindustrial
Rua Joaquim Franco da Silva, 317 
Zona Industrial JOSE RAMOS ARANTES CEP: 18810-818
PIRAJU SP', '78.320.397/0032-92', NULL, '537.101.923.111', true, 2, 7, NULL, NULL, NULL, NULL),
(1584, 'Cape Horn Coffees, Inc.', 'Cape Horn Coffees, Inc.', '191 University Blvd #515', NULL, 'Denver CO 80206', NULL, NULL, NULL, NULL, NULL, '+1 720-336-4428', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'FLO ID: 42671', 'danny@capehorncoffee.com
martha@capehorncoffee.com
mark@capehorncoffee.com
trading@capehorncoffee.com
curtis@capehorncoffee.com
traders@capehorncoffee.com
traffic@capehorncoffee.com

CAPE HORN COFFEES, INC.
191 University Blvd #515
Denver, CO 80206', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1590, 'CARLOS EDUARDO DONABELLA', NULL, 'FAZENDA SERRA', 'S/N', NULL, 'SERRA', 'MONTE SANTO', 'BRASIL', 'MG', '37968-000', NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'CV', NULL, 'CONTATO: EMANUEL
Emmanuel
35 997410414
emmanuel@com2m.com.br', NULL, '357.405.316-91', '001452269.00-37', true, 9, 2, NULL, NULL, NULL, NULL),
(1791, 'CARPEC - Cooperativa Agropecuária de Carmo do Paranaíba LTDA.', 'CARPEC', 'Av. João Batista da Silva, 398', NULL, 'Juscelino Kubitschek (JK)', NULL, 'Carmo do Paranaíba - MG', NULL, NULL, '38840-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'CARPEC - Cooperativa Agropecuária de Carmo do Paranaíba LTDA.
Av. João Batista da Silva, 398 - Juscelino Kubitschek (JK), 
Carmo do Paranaíba - MG, 38840-000', '19445733/0001-68', NULL, '1430742000052', true, 9, 7, NULL, NULL, NULL, NULL),
(1581, 'CERJA COFFEE LTDA ( JOSAPAH )', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'RE', 'CV', NULL, NULL, NULL, NULL, NULL, true, 2, 2, NULL, NULL, NULL, NULL),
(1883, 'CINCO GRÃOS REPRES. E COMERCIALIAZAÇÃO DE CAFÉ', 'CINCO GRÃOS REPRES. E COMERCIALIAZAÇÃO DE CAFÉ', 'Rua José Mambrini', '650', 'sala 2', 'Vila Helena I', 'S.S. Paraiso', NULL, 'MG', '37.950-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '23.880.589/0002-46', NULL, '42693240069', true, 2, 2, NULL, NULL, NULL, NULL),
(1432, 'COFCO Americas Resources Corp.', 'COFCO Americas', 'Four Stamford Plaza, 107 Elm Street, 7th Floor', NULL, 'CT 06902', NULL, 'Stamford, USA', NULL, NULL, NULL, '+1 203 658-2820', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'COFCO Americas Resources Corp.
Four Stamford Plaza, 107 Elm Street, 7th Floor, Stamford, 
CT, 06902, USA
Tel +1 203 658-2820
Fax +1 203 363-7940
www.cofcoagri.com', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1538, 'COFCO International Com e Armazenagem de Grãos LTDA', 'COFCO', 'Rod. BR 491 Km 174', '5005', NULL, NULL, 'Alfenas', NULL, 'MG', '37.130-001', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'COFCO International Comércio e Armazenagem de Grãos LTDA.
Rua Clóvis Machado, 176
Enseada do Suá, Vitória/ES
Edif Conilon sala 402 
CEP.: 29.050-585', '08.963.419/0001-50', NULL, '105.846.300-00', true, 7, 7, NULL, NULL, NULL, NULL),
(1769, 'Coffee Senses LTDA', 'Coffee Senses Ltda', 'Alameda Oscar Niemeyer, nº 400 room 8', NULL, NULL, NULL, 'Nova Lima, Minas Gerais', NULL, NULL, '34.006.049', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'pablo@coffeesenses.com.br
ana@coffeesenses.com.br', 'Coffee Senses LTDA
Alameda Oscar Niemeyer 400
2nd Floor Room 8
Nova Lima, Minas Gerais / Brazil

CEP 34.006-049
CNPJ: 40.903.323/0001-00 (TAX ID)', '40.903.323/0001-00', NULL, '003976362.00-15', true, 2, 7, NULL, NULL, NULL, NULL),
(1387, 'Comercial Industrial Branco Peres de Café Ltda.', 'Comercial Industrial Branco Peres de Café Ltda.', 'Av. Oswaldo Gontijo,', '20', NULL, NULL, 'Varginha', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '43.008.036/0010-15', NULL, '707.579.508.0099', false, 2, 2, NULL, NULL, NULL, NULL),
(1784, 'Comexim Europe GmbH', NULL, 'Pickhuben 6', '20457 Hamburg', NULL, NULL, 'Germany', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Comexim Europe GmbH
Pickhuben 6
20457 Hamburg
Germany', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1041, 'Complete Coffee Limited', 'Complete Coffee', 'Corinthian House, 17', NULL, 'Lansdowne Road, Croydon', NULL, NULL, 'CR0 2BX, United Kingdom', NULL, NULL, '442074038787', NULL, '44 207403 5276', NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Mr. Sean Murphy


Complete Coffee Ltd. t/a Ridge & Breminer
1 Kentish Buildings - 125
Borough High Street   / SE1 1 NP 
London, England

New Bank - Jan. 3rd, 2014.

HSBC Bank PLC,
Global Trade and Receivables,
Finance Business Services,
3rd Floor,
4 Hardman Square,
Manchester,
M3 3EB

PLEASE NOTE THAT FROM 24TH MARCH 2016
OUR NEW ADDRESS IS

COMPLETE COFFEE LIMITED 
CORINTHIAN HOUSE 
17LANSDOWNE ROAD
CROYDON
CR0 2BX', NULL, NULL, NULL, true, NULL, 19, NULL, NULL, NULL, NULL),
(1085, 'Continental Trade & Commodity Services Ltd.', 'CTCS - Continental Trade & Commodity Services Ltd.', 'Alexander House, London Road', '39', NULL, 'Sevenoaks', 'Kent', 'United Kingdom', NULL, 'TN13 1AR', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'Mr. Paul Cooke', 'FLO ID: 3736


Bank Details (as of Jan 8th, 2016):
Lloyds TSB Bank Plc
Trade Services 
4th Floor, 
Two Brindley Place, 
P O Box 63
Birmingham, B1 2AB.', NULL, NULL, NULL, true, NULL, 15, NULL, NULL, NULL, NULL),
(1148, 'COOP. DE PROD. E EXP. DE CAFE DO CERRADO LTDA.', 'COODEPEC', 'RUA  CESARIO ALVIM', '655', NULL, 'CENTRO', 'PATROCINIO', 'BRASIL', 'MG', '38740.000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '12.061.112/0001-31', NULL, '00161085400-10', true, 9, 2, NULL, NULL, NULL, NULL),
(1566, 'Coop. dos Pequenos Agricultores de Café de Santana da Vargem', 'COOPASV', 'Rua Jorge L. M. Bastos, 112 - Bairro São Luiz', NULL, 'Santana da Vargem/MG - Brasil', NULL, '37195-000', NULL, NULL, NULL, '(35) 3858-1471', NULL, NULL, NULL, NULL, 'coopasv@coopasv.com', 'J', 'CL', 'CV', 'skype: unipasv', 'COOPASV - Cooperativa dos Pequenos Agricultores de
Café de Santana da Vargem.

Rua Jorge L. M. Bastos, 112 - Bairro São Luiz
Santana da Vargem/MG - Brasil
CEP 37195-000

Diretor Presidente: Francisco Alves de Assis
Diretor Comercial: Gilmar Donizete de Oliveira
Diretor Financeiro: Antônio Afonso de Oliveira', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1343, 'COOP. REG. DE CAFEIC.EM GUAXUPÉ LTDA - COOXUPÉ.', 'COOP. REG. DE CAFEIC.EM GUAXUPÉ LTDA - COOXUPÉ.', 'Rodovia SP, KM 205-Alameda Dionísio Guedes Barreto', 'S/N', NULL, 'Chácara Cafecran', 'São José do Rio Pardo', NULL, 'SP', '13.720-000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'CL', 'CV', NULL, NULL, '20.770.566/0023-15', NULL, '646.021.015.117', true, 2, 2, NULL, NULL, NULL, NULL),
(1062, 'COOP.REG.DOS CAF. DE S.SEBASTIAO DO PARAISO LTDA', 'COOPARAISO', 'Rua Carlos Mumic', '140', NULL, 'Vila Elza', 'São Sebastião do Paraíso', 'Brazil', 'MG', '37950-140', '35 3411-7000', NULL, NULL, '35 9919-8185', NULL, NULL, 'J', 'CL', 'CV', 'aol: almeidanic  skype: nicalmeida 
msn: nicollybrazuka@hotmail.com', 'COOP. REG. DOS CAF. DE S.SEBASTIÃO DO PARAISO LTDA
COOPARAISO
COFFEE DEPARTMENT

13 3219-7570

wwww.cooparaiso.com.br', '24.896.409/0001-04', NULL, '647.030.846.0096', true, NULL, 2, NULL, NULL, NULL, NULL),
(268, 'COSTA CAFÉ COMÉRCIO EXP. IMP. LTDA', NULL, 'ESTRADA ALBERTINA ESP. SANTO PINHAL', 'KM 1', NULL, 'SANTA CLARA', 'ALBERTINA', NULL, 'MG', '37596-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'CV', NULL, 'CONTATO:', '54.122.775/0004-01', NULL, '014.577.867.0174', false, NULL, 7, NULL, NULL, NULL, NULL),
(1858, 'CRISCUOLO COFFEE COM. IND, REP. E EXP, DE CAFES LTDA', 'CRISCUOLO COFFEE COMERCIO, INDUSTRIA, REPRESENTACAO E EXPORTACAO DE CAFES LTDA', 'AV JOSE BUENO DE PAULA', '570', NULL, NULL, 'CAMPOS ALTOS', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '40.271.981/0001-26', NULL, '003931757.00-62', true, 2, 2, NULL, NULL, NULL, NULL),
(1413, 'CTCS Green Coffee', 'CTCS Green Coffee', 'Alexander House, 31-39 London Road, Sevenoaks', NULL, NULL, NULL, 'Kent', 'United Kingdom', NULL, NULL, '00 44 1732 2285', NULL, NULL, NULL, NULL, NULL, 'J', NULL, 'CV', NULL, NULL, NULL, NULL, NULL, true, 15, 15, NULL, NULL, NULL, NULL),
(1160, 'DANILO BARBOSA', 'DANILO BARBOSA', 'FAZENDA CACHOEIRA', NULL, NULL, NULL, 'CARMO DO PARANAIBA', 'BRASIL', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'CV', NULL, NULL, '239.064.306-00', NULL, '0011428210075', true, 9, 2, NULL, NULL, NULL, NULL),
(1514, 'DUCAFE - Assessoria em Negocios', 'DUCAFE', 'Rua Martins Mundim', '21', 'sala 1', NULL, 'Patrocinio', NULL, 'MG', '38.740-016', '(34)3199-0410', NULL, NULL, '(34)99988-1410', 'ducafenegocios@hotmail.com', NULL, 'J', 'RE', 'CV', NULL, 'VANDUIR', NULL, NULL, NULL, true, 2, 8, NULL, NULL, NULL, NULL),
(1598, 'E.F. Comércio e Distribuição de Produtos Alimentícios LTDA.', 'E.F. Produtos Alimentícios LTDA.', 'Av. Senador Feijó, 686 sala 1906', NULL, 'Vila Mathias, Santos/SP', NULL, '11015-504', NULL, NULL, NULL, '(13) 3468-4583', '(13) 3371-1083', NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'E.F. Comércio e Distribuição de Produtos Alimentícios LTDA.

Mr. Pedro Ferrari', '32.450.692/0001-66', NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1108, 'Ecom Agroindustrial Corp. Ltd', 'Ecom Agroindustrial', 'Avenue Etienne Guillemin, 16', NULL, NULL, 'P.O. Box 64 /', 'Pully -', 'Switzerland', NULL, 'CH-1009', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'FDA N° : 13777828022
FLO ID : 3588', 'Crédit Agricole (Suisse) SA 
Documentary Credit dept. /  CNE3 / 02 
Rue du Rhône, 19
CH - 1204 Geneva
T  +41 58 321 66 28', NULL, NULL, NULL, true, NULL, 7, NULL, NULL, NULL, NULL),
(1855, 'EDIMAR DUTRA CASTRO', 'EDIMAR DUTRA CASTRO', 'FAZENDA TABOCA', NULL, NULL, NULL, 'S.S. PARAISO', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'CV', 'Registro no CAR: MG-3164704-F2B7017D411643EBB971B95E4BC8074C', 'EXATA CORRETORA', NULL, '444.092.656-87', '001.239.847.00-67', true, 9, 2, NULL, NULL, NULL, NULL),
(643, 'EDUARDO JUNQUEIRA NOGUEIRA', 'EDUARDO', 'FAZ. CAPETINGA -ROD. BOA ESPERANÇA À CAMPOS GERAIS', 'KM 13', NULL, NULL, 'BOA ESPERANÇA', 'TRÊS PONTAS', 'MG', NULL, '35-99715353', NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'CV', NULL, 'Avenida Juvenal Correa de Figueiredo, 314 - Centro 
Três Pontas - MG
CEP: 37.190-000', NULL, '030.312.926-34', '001.337.868-0032', true, NULL, 2, NULL, NULL, NULL, NULL),
(1639, 'Equatorial Traders Limited', 'Equatorial Traders Limited', 'Unit 3, The Onyx, 102 Camley Street,', NULL, NULL, 'King''s Cross,', 'London N1C 4PF', NULL, NULL, NULL, '44 208 864 9422', NULL, NULL, NULL, NULL, 'rafaella@equatorialtraders.com', 'J', 'CL', 'CV', NULL, 'Equatorial Traders Limited 
Unit 3, The Onyx,
102 Camley Street,
King''s Cross,
London N1C 4PF

Tel: +44 208 864 9422
TAX ID: GB 581 8472 11', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1524, 'Exp. Capricórnio Coffees LTDA', 'Capricórnio Coffees', 'Estrada dos Pioneiros, 950', NULL, 'Jardim Morumbi, Londrina/PR', NULL, '86036-370', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'capricornio@capricorniocoffees.com.br', NULL, 'J', 'CL', 'CV', NULL, 'Enviar confirmação para:
rezende@capricorniocoffees.com.br


Razão Social: 
EXPORTADORA CAPRICÓRNIO COFFEES LTDA 
Endereço:
Estrada dos Pioneiros, 950, Jardim Morumbi 
Londrina/PR - 86036-370 
CNPJ: 23.015.840/0001-23 
I.E. 90.70.16.97-86 
NIRE: 41208245492 
CCM: 1092100 
Ramo de Atividade: Comércio Atacadista de Café em Grãos

Contato fiscal/financeiro: fiscal@capricorniocoffees.com.br
Contato logística: traffic@capricorniocoffees.com.br

Intermediary Bank
Standard Chartered Bank, New York, USA
SWIFT code SCBLUS33
ABA 026002561

Beneficiary Bank
Banco Itau BBA S/A, São Paulo, Brazil
SWIFT code: ITAUBRSPNHO

Final Beneficiary
Name: EXPORTADORA CAPRIC COFFEE LTDA
Branch Number: 3711
Account Number: 328462
Tax ID 23015840000123
IBAN BR28 6070 1190 0371 1000 0328 462C 1', '23.015.840/0001-23', NULL, '90.70.16.97-86', true, 8, 7, NULL, NULL, NULL, NULL),
(489, 'Expocacer Coop. dos Cafeicultores do Cerrado Ltda.', 'EXPOCACCER', 'Avenida Faria Pereira', '3945', 'Industrial District,', NULL, 'Patrocínio - MG', NULL, NULL, '38740-000', '34 3839 9300', NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'CV', NULL, NULL, '71.352.553/0001-51', NULL, '481.865.109.0018', true, NULL, 7, NULL, NULL, NULL, NULL),
(1449, 'EXPORTADORA CAPRICÓRNIO COFFEES LTDA', 'EXPORTADORA CAPRICÓRNIO COFFEES LTDA', 'Rua Hugo Luz', '361', NULL, 'Vila Santos Dumont', 'Ourinhos', NULL, 'SP', '19908-120', '14-31619060', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '23.015.840/0003-95', NULL, '495.246.177114', true, 2, 2, NULL, NULL, NULL, NULL),
(1637, 'Exportadora de Cafés Patrocínio Ltda', 'Exportadora de Cafés Patrocínio Ltda', 'Rua Martins Mundim', '21', 'sala 1', NULL, NULL, NULL, 'MG', '38740-016', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Exportadora de Cafés Patrocínio Ltda
Rua Martins Mundim 21 - Sala 01 Centro
Cep: 38740-016  Patrocinio/MG

Dados bancários (4/2/2020):

AG:0274-7
C/C: 61732-6
Bank Name: BANCO DO BRASIL S.A.
Bank No.	001
Bank BIC Code: BRASBRRJBHE
Bank Account: XXXXXX7326
IBAN: BR1400000000002740000617326C1', '27.488.481/0001-82', NULL, '002.945.841-0037', true, 7, 2, NULL, NULL, NULL, NULL),
(1706, 'Fafcoffees - Exp., Assessoria, Emp. e Part. Ltda. - ME', 'Fafcoffees - Exp., Assessoria, Emp. e Part. Ltda. - ME', 'Fazenda Ambiental Fortaleza', 'S/N', 'Dist. Igaraí', 'Zona Rural', 'Mococa', 'Brasil', 'SP', '13750-000', '(19)9 9637-4500', NULL, NULL, NULL, 'financeiro@fafcoffees.com', NULL, 'J', 'CL', 'CV', NULL, 'Novos Dados(15/10/2020)
FAFCOFFEES - EXPORTAÇÃO, ASSESSORIA, EMPREENDIMENTOS E PARTICIPAÇÕES LTDA - ME
End.: Fazenda Ambiental Fortaleza, s/nº - Distrito de Igaraí (Zona Rural)
CEP: 13750-000 - Mococa (SP)
CNPJ: 04.102.939/0001-18
I.E: 453.150.863.119
Telefone: (19) 9.9637-4500
E-mail: financeiro@fafcoffees.com', '04.102.939/0001-18', 'N/A', '453.150.863.119', true, 15, 15, NULL, NULL, NULL, NULL),
(1423, 'Falcafé  Comercio Exp. e Imp. de café ltda', 'Falcafé', 'Rua José Zamot', '96', 'Varzea', NULL, 'Ouro Fino', 'Brasil', 'MG', '37570-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Jose.almagro@falcafe.com.br', '04.618.562/0002-35', NULL, '0010635070073', true, 8, 2, NULL, NULL, NULL, NULL),
(1438, 'Falcafé Comércio, Exportação e Importação de Café Ltda.', 'Falcafé', 'Rua Governador Pedro de Toledo,', '220', NULL, 'Vila Monte Negro -', 'Espirito Santo do Pinhal / SP', NULL, NULL, '13990-000', '19 3661-9061', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'FALCAFÉ COMERCIO, EXPORTAÇÃO E IMPORTAÇÃO DE CAFÉ LTDA

Rua: Governador Pedro de Toledo  N° 220 - Vila Monte Negro
Espirito Santo do Pinhal - SP  - CEP: 13990-000
Telefone : 19 3661-9061
CNPJ: 04.618.562/0001-54
Inscrição Estadual: 530.085.240-113', '04.618.562/0001-54', NULL, '530.085.240-113', true, 7, 7, NULL, NULL, NULL, NULL),
(994, 'Fazenda Folhados', NULL, 'Rod. BR 365 Km 6  Trevo de Folhados', NULL, NULL, NULL, 'Patrocinio', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'CV', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1835, 'Fazendas Dutra Cultivo Imp. e Exp. de Café LTDA', 'Fazendas Dutra', 'Fazenda Santa Helena, nº 100', NULL, 'Zona Rural, Caputira/MG', NULL, NULL, NULL, NULL, '36.925-000', '55 33 999030707', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'Pessoa física:
Ednilson Alves Dutra
CPF : 621.217.826-72', 'Fazendas Dutra Cultivo Imp. e Exp. de Café LTDA 

Fazenda Santa Helena,100, Zona Rural, 
Caputira/MG, Zipcode:36.925-000', '26.157.261/0001-03', NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(921, 'Fazendas Dutra Specialty Coffee', 'Fazendas Dutra Specialty Coffee', 'Rua Desembargador Alonso Starling, 327', NULL, NULL, NULL, 'Centro, Manhuaçu - MG', NULL, NULL, '36900-000', '(33) 3331 3490', NULL, NULL, '33-99841707', 'cafe.dutra@gmail.com', NULL, 'J', 'CO', 'CV', NULL, 'Emissao de nota fiscal;

Pessoa física:
Ednilson Alves Dutra
Rua Desembargador Alonso Starling, 327
Centro - Manhuaçu - MG
CPF : 621.217.826-72', NULL, NULL, NULL, true, NULL, 7, NULL, NULL, NULL, NULL),
(1575, 'Federación Nacional de Cafeteros de Colombia', 'FNC', 'Calle 73 No 8-13', 'Torre A Piso 6', 'Bogotá - Colombia', NULL, NULL, NULL, NULL, NULL, '(+57) -3136600', NULL, NULL, NULL, 'jmesa@juanvaldez.com', 'informacion.comercial@cafedecolombia.com', 'J', 'CL', 'CV', 'Mr. Guido Fernandez', 'Colombia- Bogotá

Juan Camilo Ramos


Calle 73 No 8-13 
Torre A Piso 6
Bogotá - Colombia', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1672, 'Floriana Impex Limited', 'Floriana Impex Limited', 'No. 11, L-Ufficcji - Ground floor', NULL, 'Misrah 28, Birkirkara - Malta', NULL, NULL, NULL, NULL, NULL, '+356 203 300 83', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'Registration number C86814
VAT registration number MT25326716', 'FLORIANA IMPEX LIMITED
NO. 11 L-UFFICCJI-GROUND FLOOR
MISRAH 28, BKR 1501
BIRKIRKARA - MALTA

Contact:
Sergey Bogomolov
Director of Development

WINTERGREEN tea&coffee

73, Volokolamskoe sh.
Moscow, 125424, Russia
Cell. +7 967 113 12 27
Tel./fax: +7 495 380 1979 (ext. 357)
sergey.bogomolov@wintergreen.ru
www.wintergreen.ru', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1248, 'Fortaleza Agro Mercantil Ltda.', NULL, 'Av. Rio de Janeiro', '221', '7º Andar', NULL, 'Londrina', 'Brasil', 'PR', '86010-918', '(43) 3322-3965', NULL, NULL, '(43) 9180 4877', NULL, NULL, 'J', 'CL', 'CV', NULL, 'Contato: Mr. Pedro Paulo Almeida Guimarães', '05.735.193/0001-42', NULL, '90287045-82', true, 8, 15, NULL, NULL, NULL, NULL),
(1728, 'FORTALEZA AGRO MERCANTIL LTDA.', 'Fortaleza Agro', 'RUA GUILHERME FRANCISCO ZANATELLI', NULL, NULL, NULL, 'VARGINHA', 'Brasil', 'MG', '37026-653', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '05.735.193/0008-19', NULL, '0010129470155', true, 8, 9, NULL, NULL, NULL, NULL),
(413, 'Gardingo Trade Imp. e Exp. Ltda', 'GARDINGO', 'Av. São João, 106', NULL, NULL, NULL, 'Matipó -', NULL, 'MG', NULL, '31-38731454', NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CV', NULL, 'CONTATO: ZE GERALDO


GARDINGO TRADE IMP. E EXP. LTDA.
AV. SAO JOAO, 106 - SALA 05
CENTRO- MATIPO - MG - BRASIL
CEP: 35.367-000 FONE: 31-38731454
CNPJ: 00.681.184/0001-00', '00.681.184/0001-00', NULL, '409.963.232.0017', true, NULL, 21, NULL, NULL, NULL, NULL),
(1795, 'GARDINGO TRADE IMPORTACAO E EXPORTACAO LTDA', 'GARDINGO TRADE IMPORTACAO E EXPORTACAO LTDA', 'Fazenda Santa Maria', '03', NULL, 'Zona Rural', 'Matipó', NULL, 'MG', '35368-000', '(31)3873-1454', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '00.681.184/0001-00', NULL, '409.963.232/0017', true, 2, 2, NULL, NULL, NULL, NULL),
(1563, 'GERALDO MAGELA LACERDA', 'GERALDO MAGELA LACERDA', 'FAZENDA  OLHOS D`AGUA', 'S/N', 'ZO', 'ZONA RURAL', 'IBIA', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', NULL, 'CV', NULL, NULL, '406 262 026-04', NULL, '0011877330000', true, 9, 2, NULL, NULL, NULL, NULL),
(1787, 'Grano Trading Exportadora e Importadora Ltda', 'Grano Trading Exportadora e Importadora Ltda', 'Avenida Juscelino Kubitschek de Oliveira, 2741', NULL, NULL, 'Patos de Minas - MG', '/ 38706-215', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'De: Fabiana V. Boroni 
Enviada em: sexta-feira, 28 de abril de 2023 17:16

Grano''s address has been changed:
Grano Trading Exportadora e Importadora Ltda
Avenida Juscelino Kubitschek de Oliveira, 2741
Bairro Residencial Gramado
Patos de Minas/MG
CEP: 38706-215', '03.977.522/0001-36', NULL, '349093548.00-69', true, 7, 7, NULL, NULL, NULL, NULL),
(1816, 'Grano Trading Exportadora e Importadora LTDA', 'Grano Trading Exportadora e Importadora LTDA', 'Rua Dr. Mato Grosso', '4', 'sala3', NULL, 'Esp. Sto do Pinhal', NULL, 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '03.977.522/0003-06', NULL, '530.077.682.116', true, 2, 2, NULL, NULL, NULL, NULL),
(1012, 'Gustav Paulig Ltd', NULL, 'Satamakaari 20', 'PB 15,', '00981 Helsinki', NULL, NULL, NULL, NULL, NULL, '00 358 0 318864', NULL, NULL, NULL, NULL, '�_�\u0000��ax�Ԇ\u0000�0F:�Jd\u0016�[�Ȇ8��b�Y:m����V<\u0006����|I\u001e����xk�p>�]:(V+��\u001d�U�����t�9>�i\u001a~�n!�l��\"\u0003\u0001a�''��W|���\u0000�R\np���BU\u001bӠЀ\fv���QZ\u0010\u0014QE\u0000\u0014QE\u0000\u0014QE\u0000\u0014QE\u0000\u0014QE\u0000\u0014QE\u0000\u0014QE\u0002\nJ(�0jZ(�\u0001E\u0014P\u0001E\u0014P\u0007��', 'J', 'CL', 'CV', NULL, 'Evergreen line
contract number as they changed it.
Should be SQ H2590004 REF. HEL 77325001

Endereço e Notify de envio para as amostras do Gustav Paulig com destino Oslo:
 
Kjeldsberg Kaffebrenneri AS - Consignee
Postboks 1820 Lade
7440 Trondheim, Norway
fax.: +47 73600200
 
Tonsberg Spedisjon  - Notify
Postboks 119 Sentrum
3101 Tonsberg Norway
Contact person Tone 
Phone + 47 33347733
Fax + 47 33347711


E-mail de 05/agosto/2009:
Please send the documents directly to us:
We are moving on 7th September to our new plant, 

Satamakaari 20, FI-00980 Helsinki 
Postal address: POB 15, FI-00981 Helsinki 

Bank Details received on October 22nd, 2009:

We prefer the documents in trust as there usually is quite expensive costs when the documents have been sent via bank.

BANK NAME	   SAMPO BANK PLC
STREET ADDRESS  Unioninkatu 22
		   HELSINKI  / FINLAND
MAIL ADDRESS	   PL 1024, 00075 SAMPO
ACCOUNT NO	   800061-40189101  (USD-ACCOUNT)
SWIFT		   DABAFIHH
IBAN CODE	   FI34 8000 6140 1891 01
COVER BANK	   Bank of America, NEW YORK, USA
Account		   6550253668', NULL, NULL, NULL, true, NULL, 7, '����\u0000\u0010JFIF\u0000\u0001\u0001\u0001\u0000`\u0000`\u0000\u0000��\u0000C\u0000\u0006\u0004\u0005\u0006\u0005\u0004\u0006\u0006\u0005\u0006\u0007\u0007\u0006\b\n\u0010\n\n\t\t\n\u0014\u000e\u000f\f\u0010\u0017\u0014\u0018\u0018\u0017\u0014\u0016\u0016\u001a\u001d%\u001f\u001a\u001b#\u001c\u0016\u0016', NULL, NULL, false),
(1020, 'H.A. Bennett & Sons Pty Ltd.', 'H.A. Bennett & Sons', 'Unit 2,  2 Walton Street', NULL, 'Kew VIC  3101', NULL, NULL, 'Australia', NULL, NULL, '61 3 9853 0328', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'RA_00093232203 - received on Aug 17th 2025', 'H.A. BENNETT & SONS
BENNETT
MR. SCOTT BENNETT

H.A. Bennett & Sons Pty Ltd
Unit 2, 2 Walton Street
Kew  VIC  3101
Australia

Bank Details Received (January 22nd, 2010)

H.A. BENNETT & SONS PTY. LTD.
National Australia Bank
International Trade Solutions 
Level 5, 383 King Street, West Melbourne, 
Victoria 3004, Australia
Account Number:  HABENUSD01. 
SWIFT NATAAU3303M', NULL, NULL, NULL, true, NULL, 7, NULL, NULL, NULL, NULL);
