-- Bulk import of all remaining legacy clients
INSERT INTO public.legacy_clients (
    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
    logo, logo_altura, logo_largura, auto_size
) VALUES
(364, 'ODEBRECHT COMÉRCIO E INDÚSTRIA DE CAFÉ LTDA', NULL, 'ROD. CARLOS JOÃO STRASS - PR 545', 'KM 05', NULL, 'DIST. DA WARTA', 'LONDRINA', 'LONDRINA', 'PR', '86.105-000', '(43) 3204141', NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO:', '78.597.150/0002-00', NULL, '601.02051-30', true, NULL, NULL, NULL, NULL, NULL, NULL),
(873, 'ODEBRECHT COMÉRCIO E INDÚSTRIA DE CAFÉ LTDA', 'ODE', 'RUA XV DE NOVEMBRO', '49', NULL, NULL, 'SANTOS', 'SANTOS', 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '78.597.150/0003-83', NULL, '633.252.262.113', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1551, 'OLAM AGRÍCOLA LTDA', 'OLAM AGRÍCOLA LTDA', 'R: RIBEIRÃO DA GARÇA', '51 A', NULL, 'VILA ARACELI', 'GARÇA', NULL, 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, '07.028.528/0012-70', NULL, '315.092.716.113', true, 2, 2, NULL, NULL, NULL, NULL),
(1206, 'Olam Specialty Coffee.', 'Olam Specialty Coffee', '118 Mathenson St. 3rd floor', NULL, NULL, NULL, 'Healdsburg', 'CA', NULL, '95448', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'PS-sample needs to be sent to their office in California, not to NY

California office:
118 Matheson St., 3rd Floor, Healdsburg, CA 95448.', NULL, NULL, NULL, true, 7, 14, NULL, NULL, NULL, NULL),
(702, 'OLAVO BARBOSA', 'OLAVO', NULL, NULL, NULL, NULL, NULL, NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1347, 'Olh Foods Alimentos Ltda', 'Olh Foods Alimentos Ltda', 'CSG 07 Lote 08 Loja Térreo, Parte', NULL, NULL, 'Taguatinga Sul', 'Brasilia', NULL, 'DF', '72035507', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, '20.320.631/0001-03', NULL, '07.682.184/001-05', true, 2, 2, NULL, NULL, NULL, NULL),
(498, 'OLIVEIRA & ROCHA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(896, 'OSVALDO VIEIRA E OUTROS', 'OSVALDO', 'Estrada Sarutaiá Timburi, km 2', NULL, NULL, NULL, NULL, NULL, NULL, '18840-000', NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'CO', NULL, 'Mr. Rodrigo Anunciato


Av. São Sebastião, 627 
Jd Ana Carolina - Piraju/SP 
18800-000


financeiro@unimespagropecuaria.com.br   ( larissa )', '08.416.592/0006-43', NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 'OTTONI & FILHOS IND. COM. IMP. EXP. LTDA', 'OTTONI', 'RUA XV DE NOVEMBRO', '188', NULL, NULL, 'POÇOS DE CALDAS', 'POÇOS DE CALDAS', 'MG', '37.701-038', '(35) 7223053', NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO: CRISTIANO', '42.995.118/0001-47', NULL, '518.826.034.0067', true, NULL, NULL, NULL, NULL, NULL, NULL),
(736, 'OUTSPAN BRASIL IMPORTAÇÃO E  EXPORTAÇÃO LTDA', 'OUTSPAN', 'ROD. BR 491 -', '2005', NULL, NULL, 'ALFENAS', NULL, 'MG', '37130000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '07.028.528/0008-94', NULL, '236.208.005.0396', true, NULL, 2, NULL, NULL, NULL, NULL),
(1842, 'ÖZDEM HARMAN GIDA SANAYI VE DIS TICARET LIMITED SIRKETI', 'OZDEM HARMAN GIDA SANAYI VE DIS TICARET LIMITED', 'BOZBURUN MAHALLESI 7121 SK.', NULL, '20010 MERKEZEFENDI', NULL, 'DENIZLI, TURKEY', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', 'MR. CEM KÜRSAT ÖZKAN / Mr. Finn Egholm
Tel. +90 554 325 03 65', 'ÖZDEM HARMAN GIDA SANAYI VE DIS TICARET LIMITED SIRKETI
TAX ID:  6740913964
ADDRESS: BOZBURUN MAHALLESI 7121 SK. NO: 39
POSTAL & CITY:  20010 MERKEZEFENDI
STATE:  DENIZLI
COUNTRY: TURKEY
CONTACT
MR. CEM KÜRSAT ÖZKAN
Tel. +90 554 325 03 65', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1335, 'Paragon Coffee Trading Co. L.P.', 'Paragon', 'Hamilton Avenue', '445', NULL, NULL, 'White Plains', 'United States', 'NY', '10601', '1 914 949 2233', NULL, NULL, NULL, NULL, 'michael@paragoncoffee.com', 'J', 'CL', 'CO', NULL, NULL, NULL, NULL, NULL, false, 15, 15, NULL, NULL, NULL, NULL),
(962, 'PASTIFICIO SANTA AMALIA S/A', 'STA AMALIA', 'ROD. BR 381 KM 697', 'SALA 1', NULL, NULL, 'TRÊS CORAÇÕES', 'TRÊS CORAÇÕES', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'ZÉ GERALDO', '22.229.207/0027-04', NULL, '390.014.795-1890', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1262, 'PASTIFICIO SELMI S/A', 'PASTIFICIO SELMI', 'Rua Benjamin Constant,', '373', 'sala 221', NULL, 'Sao Joao da Boa Vista', NULL, 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, '46.025.722/0024-98', NULL, '639.257.781.114', true, 2, 2, NULL, NULL, NULL, NULL),
(958, 'PASTIFÍCIO SELMI S/A', 'PASTIFICIO', 'Rua Padre Henry Mothon', '282', 'sala C', NULL, 'POÇOS DE CALDAS', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '46.025.722/0025-79', NULL, '186.362.188.0197', true, NULL, 2, NULL, NULL, NULL, NULL),
(1849, 'Pazartrading Pazarlama Ihracat Ithalat Sanayi Ve Ticaret Limited Sirketi.', 'Pazartrading Pazarlama', 'Kirmizitoprak - Porsuk, Bulvari', NULL, 'Nilay SK No 11B, Odunpazari', NULL, 'Eskisehir, 26020, Turkey', NULL, NULL, NULL, '+13104390426', NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'CO', 'Tax info : Eskisehir V.D. 7230756487', 'Pazartrading Pazarlama Ihracat Ithalat Sanayi Ve Ticaret Limited Sirketi
Kirmizitoprak Mahallesi Porsuk, Nilay SK No 11B Odunpazari
Eskisehir, 26020, Turkey


Pazartrading Pazarlama Ihr Ith
San Ve Tic Ltd Sti Kirmizitoprak Mahallesi Porsuk, Bulvari
Nilay SK No 11B Odunp.,
Eskisehir, 26020, Turkey


title  : Pazartrading Pazarlama Ihr. Ith. San. Ve Tic. Ltd. Sti. 

address : Kirmizitoprak Mahallesi Porsuk Bulvari Nilay Sokak No 11 B Odunpazari/ Eskisehir

tax info : Eskisehir V.D. 7230756487

email: tanberk@pazartrading.com

phone number : +13104390426', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(448, 'PCS EXPORTADORA LTDA', NULL, 'ROD. POÇOS DE CALDAS / PALMEIRAL', NULL, NULL, NULL, 'POÇOS DE CALDAS', 'POÇOS DE CALDAS', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO: BOURBON', '60.802.527/0001-61', NULL, '518.042.479.0011', true, NULL, NULL, NULL, NULL, NULL, NULL),
(499, 'PLENO  - COAMO', 'PLENO  - COAMO', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(532, 'Pleno Corretora - Cerrado', 'Pleno Corretora - Cerrado', 'Av. Faria Pereira', '1256', 'SL 2/4', 'B.N. Sra Fátima', 'Patrocínio', 'Brasil', 'MG', '38740-000', '(34)3831-0117', 'Edson 9167-4948', NULL, 'Celso 9167-4947', 'koshiba@plenocafe.com.br', 'ekoshiba@hotmail.com', 'J', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, 8, NULL, NULL, NULL, NULL),
(1708, 'PRATA PEREIRA COMERCIO IMPORTAÇÃO E EXPORTAÇÃO DE CAFÉ LTDA.', 'PRATA PEREIRA COMERCIO IMPORTAÇÃO E EXPORTAÇÃO DE CAFÉ LTDA.', 'RODOVIA SP 342 KM 204', NULL, NULL, NULL, 'ESP. STO DO PINHAL', NULL, 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, '00.544.628/0004-09', NULL, '530.070.172-110', true, 2, 2, NULL, NULL, NULL, NULL),
(1080, 'Prestige Commodites Inc.', NULL, 'Chera Chambers - Road Town Tortola', NULL, NULL, NULL, NULL, 'British Virgin Islands', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'Seller:
Prestige Commodites Inc.
Office of Sucre & Sucre Trust LTD
Chera Chambers - Road Town Tortola
British Virgin Islands


Grande Leste Exportação e Importação de Café Ltda.
Av. Adorvado José Vallim   879
Distrito Industrial - São João da Boa Vista - SP
cep: 13877-770
CNPJ: 06.319.278/0002-93
IE: 639.237.169-117

Terra Forte Exportação e Importação de Café Ltda.
RUA MARIA LAZARA RUBIM RINCO, Nº. 4
BAIRRO DIVINO ESPÍRITO SANTO
ALBERTINA - MG - CEP. 37.596-000
CJPJ:07.805.743/0001-88
IE:518.998.275.0075', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1105, 'PRIME COMÉRCIO EXP. DE CAFÉ LTDA.', 'PRIME', 'Av. Orlando Barbosa,', '2158', NULL, NULL, 'Patrocinio', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, '05.262.924/0001-80', NULL, '481.1925.3696', true, NULL, NULL, NULL, NULL, NULL, NULL),
(693, 'PRINCIPAL COM. IND. DE CAFE LTDA', 'PRINCIPAL', 'RUA PLINIO CASADO', '1416', NULL, NULL, 'NOVA IGUACU', 'NOVA IGUACU', 'RJ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '30.740.773/0001-75', NULL, '80.348-673', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1857, 'Prochain Service CO., Limited', 'Prochain Service Co., Ltd.', 'Units Nos.2306B AND 2307, 23/F.,West Tower', 'No.168-200', 'Connaught Road Central, Hong Kong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', 'Mrs. Ada Wu
email: wuyw@cndmerchandise.com 
          ccs@cndmerchandise.com', 'Buyer: Prochain Service Co., Ltd.
Address: Units Nos.2306B AND 2307, 23/F.,West Tower
Shun Tak Centre.
No.168-200, Connaught Road Central, 
Hong Kong

RM 2306B & 2307 23/F WEST TOWER, S HUN 
TAK CTR NO 168-200 CONNAUGH, HO NG 
KONG, CN HONG KONG, HONG KONG', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(763, 'PRODUCERS', 'PROOD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(918, 'PROZOLINO CORTÊS QUEIROZ E OUTROS', 'PROZO', 'FAZENDA COLINA', NULL, NULL, NULL, 'PATROCINIO', 'PATROCINIO', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CO', 'CO', NULL, NULL, NULL, '013.139.406-15', '481/1355', true, NULL, NULL, NULL, NULL, NULL, NULL),
(540, 'QUALICAFEX', 'QUALICAFEX', 'PRAÇA RIO BRANCO', '13', NULL, NULL, 'ESP. STO DO PINHAL', 'ESP. STO DO PINHAL', 'SP', '13990-000', '19-3661-3339', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'NR. DA CONTA FEDEX: 29946854-2', '05.251.916/0001-38', NULL, '530.086.343.116', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1431, 'Queensway Trading Ltd.', 'Meinl Group', 'Winkelstrasse 6,', NULL, 'CH-9100 Herisau', NULL, NULL, 'Switzerland', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'CO', NULL, 'Message received from Mrs. Beatrice Brandenberger, 
dated.: April 08th, 2016:

This is another company connected to Meinl Group which
finances long term contracts.
 
Queensway Trading Ltd.
Winkelstrasse 6
CH-9100 Herisau
Switzerland
attn. Mr. Daniel Schürch

BANK COLLECTION (13/10/2016)
Alpha Rheinthal Bank AG or sent
Bahnhofstrasse 2
CH-9435 Heerbrugg
Switzerland
attn. Mr. Kurt Frei
Tel. 0041 41 71 747 95 57

IN TRUST -LIVORNO- (13/10/2016)
Francesco Parisi Casa di Spedizioni S.p.A.
attn. Luca Radovaz
Viale Miramare, 5
34135 Trieste
Italy', NULL, NULL, NULL, true, 7, 15, NULL, NULL, NULL, NULL),
(1214, 'RCMA Americas Inc.', 'RCMA Americas Inc.', '150 Boush Street', 'suite 100', NULL, NULL, 'Norfolk, VA 23510', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'RCMA Americas Inc.
150 Boush Street, suite 100
Norfolk, VA 23510', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(642, 'REALEZA SPECIALTY COFFEE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(215, 'REFINADORA DE ÓLEOS BRASIL LTDA', NULL, 'RUA FREI GASPAR', '22', '2° ANDAR CJ 23', 'CENTRO', 'SANTOS', 'SANTOS', 'SP', NULL, '2192572', NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO: NILTON', '61.079.935/0024-96', NULL, '633.309.362.117', true, NULL, NULL, NULL, NULL, NULL, NULL),
(108, 'REFINARIA PIEDADE S/A', NULL, 'RUA ASSIS CARNEIRO', '80', NULL, NULL, 'RIO DE JANEIRO', 'RIO DE JANEIRO', 'RJ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO: CIA.UNIÃO', '33.067.034/0001-52', NULL, '81.717.311', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1390, 'Reginaldo Farias Santos', 'Reginaldo Farias Santos', 'Estrada Mun. do Bairro das Serras de Baixo e Cima', 'S/N', 'Fazenda Sant''anna', NULL, 'Serra Negra', 'Brasil', 'SP', '13.930-000', NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'CO', NULL, 'Dados Bancários

Banco: Banco do Brasil
Agencia: 3150-x
Conta: 1200-9
Titular: Reginaldo Farias Santos
CPF: 004543138-88', '11.322.910/0001-07', NULL, '662.110.037.115', true, 8, 8, NULL, NULL, NULL, NULL),
(1884, 'Rich Coop Co., Ltd.', 'Rich Coop Co., Ltd.', '23/F Units Nos. 2306B & 2307', NULL, 'Shun Tak Centre West Tower 168-200', NULL, 'Connaught Rd Central', '- Hong Kong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'Rich Coop Co., Ltd.
23/F Units Nos. 2306B & 2307
Shun Tak Centre West Tower 168-200
Connaught Rd Central - Hong Kong', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(114, 'RIO DOCE CAFE S/A IMP. E EXPORTADORA', 'RIO DOCE', 'RUA MANOEL  MADEIRA', '67A', NULL, NULL, 'VARGINHA', 'VARGINHA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO:', '28.130.052/0006.06', '0', '707.280.073.0049', true, NULL, NULL, NULL, NULL, NULL, NULL),
(210, 'RIO DOCE CAFÉ S/A IMPORTADORA E EXPORTADORA', NULL, 'RUA XV DE NOVEMBRO', '65', '3° ANDAR', 'CENTRO', 'SANTOS', 'SANTOS', 'SP', '11.010-910', '2196072', NULL, '2193517', NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO:', '28.130.052/0005-25', NULL, '633.139.796.112', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1429, 'Rocket Bean Roastery', 'Rocket Bean Roastery', 'Miera iela 29/31', NULL, 'Riga, Latvia', NULL, NULL, NULL, NULL, 'LV-1001', '(+371) 26546832', NULL, NULL, NULL, NULL, 'ancis@rocketbean.lv', 'J', NULL, 'CO', NULL, 'www.rocketbean.lv

Rocket Bean Roastery, Ancis Romanovskis 
Miera iela 29/31 - Riga, Latvia
LV-1001
www.rocketbean.lv
(+371) 26 546 832

Message received on April 04th, 2016:

For Logistic matters, contact Normunds Trubens:
normunds.trubens@kcs.lv

I just talked with our hauler, they already choose the line and informed their logistic partner in Brazil.
Please contact with them and specify all necessary things. Please mention them that we  have contacted their WIN member agent in Lithuania Itella Logistics UAB:
O. Lisboa Despachos Internacionais Ltda
c/o Fax Cargo Serv - Rua Pedro de Carvalho Mendes, 36, 311110-100 Belo Horizonte - Minas Gerais (MG)
(+55)11 5581 0101 - fabia@olisboa.com.br
narjana.kurtz@olisboa.com.br"


Hamburg Süd com ITELLA
S/C LLVQ7000608', NULL, NULL, NULL, true, 7, 15, NULL, NULL, NULL, NULL),
(536, 'RONALDO TABOADA', 'RONALDO TABOADA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1374, 'Royal Coffee Inc.', 'Royal Coffee Inc.', '3306 Powell Street, Emeryville', NULL, 'CA 94608 - U.S.A', NULL, NULL, NULL, NULL, NULL, '510-652-4256', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'DOCS IN TRUST
--------------------------------------------
ROYAL COFFEE INC.
3306 POWELL STREET, EMERYVILLE CA
OAKLAND
94608
UNITED STATES
JOHN COSSETTE 
510-652-4256
TAX / VTA/ RUC Number	94-2703066


BANK INSTRUCTIONS
--------------------------------------------
Wells Fargo, National Association 
International Trade Operations
9000 Flair Drive,  3rd Floor - MAC E2002-031
El Monte, CA 91731  USA
Telephone: 1-800-798-2815
 Contact Name: Rachel Mitra
Swift Code: WFBIUS6SLAX
***ALL costs are for account of the shipper/ seller.***', NULL, NULL, NULL, true, 7, 15, NULL, NULL, NULL, NULL),
(1082, 'Rucquoy Freres N.V.', 'Rucquoy Freres', 'Van Meterenkaai', '4', 'Bus 14', 'B-2000', 'Antwerpen', NULL, NULL, NULL, '32 32378423', NULL, '32 32164095', NULL, NULL, '�E\u0015� ��(\u0000��(\u0000��(\u0000��(\u0001+���s$\u001e\n�H���R&>���\u0000', 'J', 'CL', 'CO', 'Mrs. Stéphanie Jocquet
Mr. Jérôme Geels', '06/12/2023

"The documents can be sent to our regular address: 

Rucquoy Frères
Van Meterenkaai 4/ B102
2000 Antwerpen
Belgium
"

AS OF 04/12/2020
Belfius Bank NV
Trade Finance Department
Grote Steenweg 454
2600 Berchem
Belgium
phone: +32 (0)2 222 11 11  
Mail: Incasso-Antwerpen@belfius.be

As from 24/12/2013 the new address of our bankers is: 
BNP Paribas Fortis 
Global Trade Services 
Warandeberg 8 
1000 Brussel 

+32 2 228 00 37 


Rucquoy Freres
Van Meterenkaai 4 - Bus 14
B-2000
Antwerpen

Mr. Jérôme Geels
Mrs. Stéphanie Jocquet
		
EORI or VAT: BE 0404850383', NULL, NULL, NULL, true, NULL, 7, '����\u0000\u0010JFIF\u0000\u0001\u0001\u0001\u0000`\u0000`\u0000\u0000��\u0000C\u0000\u0006\u0004\u0005\u0006\u0005\u0004\u0006\u0006\u0005\u0006\u0007\u0007\u0006\b\n\u0010\n\n\t\t\n\u0014\u000e\u000f\f\u0010\u0017\u0014\u0018\u0018\u0017\u0014\u0016\u0016\u001a\u001d%\u001f\u001a\u001b#\u001c\u0016\u0016', NULL, NULL, false),
(1379, 'S&D Coffee, Inc.', 'S&D Coffee, Inc.', '300 Concord Parkway South,', NULL, NULL, NULL, 'Concord, NC 28027', NULL, NULL, NULL, '1 (800) 933-22', NULL, NULL, NULL, 'palaciosc@sndcoffee.com', 'palaciosc@sndcoffee.com', 'J', 'CL', 'CO', NULL, 'Carlos Palacios', NULL, NULL, NULL, true, 15, 7, NULL, NULL, NULL, NULL),
(554, 'SAB TRADING', 'SAB TRADING', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL),
(500, 'SABANA TRADING', 'SABANA TRADING', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL),
(1091, 'San Cristobal Coffee Importers', 'San Cristobal', '13244 Juanita Drive NE', NULL, NULL, NULL, 'Kirkland, WA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(69, 'SANTA CLARA IND. E COM. DE ALIMENTOS', 'Santa Clara', 'ROD. BR 262', 'KM 33,5', '300', 'POUSO ALEGRE', 'MANHUACU', 'MANHUACU', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'Cadastro de booking
Sta Clara Ind. e Com. de Alimentos Ltda.
Av Salun Assaid David, 50
Varginha - Mg
Cep: 37062-650

Nota Fiscal 
SANTA CLARA INDÚSTRIA E COMÉRCIO DE ALIMENTOS LTDA
Rodovia Br-262  Km. 33,5 - Nº. 300-A -  Pouso Alegre
Manhuaçú – MG   CEP.  36900-000
CNPJ: 63.310.411/0004-46     
IE: 394.881.434.0094', '63.310.411/0004-46', NULL, '394.881.434.0094', true, NULL, NULL, NULL, NULL, NULL, NULL),
(802, 'SANTA CLARA INDUSTRIA E COMERCIO DE ALIMENTOS', 'SANTA CLARA', 'AV.SALUM ASSAD DAVID', '50', NULL, 'SANTA LUIZA', 'VARGINHA', 'VARGINHA', 'MG', '37062-650', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '63.310.411/0025-70', NULL, '394.881.434.0256', true, NULL, NULL, NULL, NULL, NULL, NULL),
(694, 'SANTA CLARA INDUSTRIA E COMERCIO DE ALIMENTOS LTDA', 'SANTA CLARA', 'RUA SANTA CLARA', '100', NULL, 'PQ. STA. CLARA', 'EUSEBIO', 'EUSEBIO', 'CE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '63.310.411/0001-01', NULL, '06.864.509-0', true, NULL, NULL, NULL, NULL, NULL, NULL),
(695, 'SANTA CLARA INDUSTRIA E COMERCIO DE ALIMENTOS LTDA', 'SANTA CLARA IND', 'ROD. BR 101 KM 10,5', 'QD 4/5', 'LOTE 140', NULL, 'NATAL', 'NATAL', 'RN', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '63.310.411/0014-18', NULL, '20.080.907-5', true, NULL, NULL, NULL, NULL, NULL, NULL),
(84, 'SANTA CRISTINA EXP. E IMP. LTDA', NULL, 'ROD. SP 215', 'KM 34', NULL, NULL, 'VARGEM GRANDE D', 'VARGEM GRANDE D', 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO:', '54.546.486/0001-97', NULL, '711.009.669.115', true, NULL, NULL, NULL, NULL, NULL, NULL),
(501, 'SANTO ANTONIO ESTATE COFFEE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL);
