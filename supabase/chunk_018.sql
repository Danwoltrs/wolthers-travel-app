-- Bulk import of all remaining legacy clients
INSERT INTO public.legacy_clients (
    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
    logo, logo_altura, logo_largura, auto_size
) VALUES
(1180, 'Cooparaíso Ltda.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'SH', NULL, NULL, NULL, NULL, NULL, false, 7, 7, NULL, NULL, NULL, NULL),
(1181, 'Cooparaíso Ltda.', 'Cooparaíso Ltda.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'CL', 'SH', NULL, NULL, NULL, NULL, NULL, false, 7, 7, NULL, NULL, NULL, NULL),
(1171, 'Cooperativa Agropecuária das Vertentes do Caparaó Ltda.', 'Cooperativa Agropecuária das Vertentes do Caparaó Ltda.', 'Rua Francisco Brinate,', '79', NULL, 'Centro', 'Caparaó', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, NULL, '11.297147/0001-01', NULL, '0014871960072', true, 7, 7, NULL, NULL, NULL, NULL),
(1861, 'Cooperativa dos Cafeicultores da Zona de Três Pontas Ltda', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, NULL, NULL, NULL, NULL, false, 7, 7, NULL, NULL, NULL, NULL),
(1443, 'Cooperativa Regional de Cafeicultores em Guaxupé Ltda.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'SH', NULL, NULL, NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1561, 'Coopercitrus - Cooperativa de Produtores Rurais', NULL, 'Praça Barão do Rio Branco, 9', NULL, 'Bebedouro - SP', NULL, NULL, NULL, NULL, '14.700-129', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'SH', NULL, NULL, NULL, NULL, NULL, false, 7, 7, NULL, NULL, NULL, NULL),
(1072, 'Costa Café Com. Exp. e Imp. Ltda.', 'correspondencia', 'Praça Amador Bueno Florence,', '274', NULL, 'Largo São João,', 'Espírito Santo do Pinhal -', 'São Paulo / Brasil - 13990-000', NULL, NULL, '(19) 36519700', NULL, NULL, NULL, NULL, 'luciano@costacafe.com.br;trade@costacafe.com.br', 'J', 'CL', 'SH', NULL, 'COSTA CAFE COM EXP E IMP LTDA
COSTA CAFE
TRADING DEPARTMENT', '54.122.775/0001-69', '3822', '530.013.903.110', true, NULL, 7, NULL, NULL, NULL, NULL),
(1608, 'EDUARDO REIS CHAVES E OUTROS', 'EDUARDO REIS CHAVES E OUTROS', 'Fazenda Turvo', NULL, NULL, NULL, 'Coqueiral', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'SH', 'SAAG -', NULL, NULL, '779.226.546-34', '001.503.394-0082', true, 2, 2, NULL, NULL, NULL, NULL),
(1109, 'EISA-Empresa Interagricola S/A', 'EISA - Empresa Interagrícola S/A', 'Rua do Comércio', '54', NULL, 'Centro', 'Santos', NULL, 'SP', '11010-140', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, 'or any other under their full responsibility.', '62.356.878/0002-00', NULL, '633.012.936-119', true, NULL, 2, NULL, 23, 23, NULL),
(1746, 'ESTERLINO LEITE CRUVINEL', 'ESTERLINO LEITE CRUVINEL', 'Faz. Mantibio', NULL, NULL, NULL, 'Medeiros', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'SH', NULL, 'NILSON', NULL, '023.911.396-91', '001.175.980-0279', true, 2, 2, NULL, NULL, NULL, NULL),
(1270, 'Fazenda Boa Vista', 'Boa Vista Farm', 'Faz. Boa Vista', NULL, NULL, NULL, 'Campos Altos', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, NULL, NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1362, 'GGA CORRETORA DE MERCADORIAS LTDA', 'GGA CORRETORA', 'Rua do Coemrcio', '55', NULL, NULL, 'Santos', NULL, 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, NULL, NULL, NULL, NULL, true, 2, 2, NULL, NULL, NULL, NULL),
(1134, 'Ipanema Comercial e Exportadora S.A. or Ipanema Agrícola S.A.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', NULL, 'SH', NULL, 'Ipanema Comercial e Exportadora S.A. or Ipanema Agrícola S.A.', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1616, 'JOSÉ MARIA DOMINGOS JUNIOR', 'JOSÉ MARIA DOMINGOS JUNIOR', 'Rua Cornelia Alves Bicalho', '102', NULL, NULL, 'Campos Altos', NULL, 'MG', '38970-000', NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'SH', NULL, 'CONTATO: NILSON - nilsongs8@gmail.com  - 34-991434888', NULL, '005.281.636-20', '001.117.134-0060', true, 2, 2, NULL, NULL, NULL, NULL),
(1817, 'JPS CORRETORA DE CAFÉ  LTDA', 'JPS', 'Rua Comandante Miranda', '545', NULL, NULL, 'Lavras', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, NULL, '09.571.253/0001-90', NULL, NULL, true, 2, 2, NULL, NULL, NULL, NULL),
(1714, 'LEONARDO MODESTO DE OLIVEIRA', 'LEONARDO MODESTO DE OLIVEIRA', 'Faz. Valinho', NULL, NULL, NULL, 'Medeiros', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'SH', NULL, 'NILSON', NULL, '971.735.096-53', '001.417.403-0022', true, 2, 2, NULL, NULL, NULL, NULL),
(874, 'Louis Dreyfus Commodities Brasil S/A', 'Dreyfus', 'ROD. BR 491 KM 233', 'S/N', NULL, NULL, 'Varginha', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'SH', NULL, 'dados p/ Nota fiscal = Santos

Rua do Comércio, 18 / 20
CNPJ: 47.067.525/0006-12
I Estadual : 633.011.540-113
I Municipal : 13523-4', '47.067.525/0075-44', NULL, '707.621.265.0536', true, NULL, 2, NULL, NULL, NULL, NULL),
(91, 'MC Coffee do Brasil Ltda.', 'MC Coffee do  Brasil', 'Rua Quinze de Novembro, 52', NULL, '1st and 2nd floor', 'Centro -', 'Santos/', NULL, 'SP', '11010-150', '(13) 3213-1185', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, 'CONTATO NOTAS DE EXPORTAÇÃO:

odair.ramos@mccoffee.com.br
diego.monteiro@mccoffee.com.br', '00.844.405/0001-06', '116050-9', '633.349.675.118', true, NULL, 7, NULL, NULL, NULL, NULL),
(1794, 'Mercon Brasil Com. de Café LTDA.', 'Mercon Brasil', 'Alameda do Café, n° 209 - 1° andar', NULL, 'Jardim Andere,', NULL, 'Varginha - MG, 37026-400', NULL, NULL, NULL, '(35) 3222-6862', NULL, NULL, NULL, NULL, 'mbrtradingdesk@merconcorp.com', 'J', 'CL', 'SH', NULL, 'Mercon Brasil Com. de Café LTDA.
n° 209 - 1° andar, Alameda do Café - Jardim Andere, 
Varginha - MG, 37026-400', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1389, 'Mild Coffee Company Huila', 'Mild Coffee Company Huila', 'Cra. 5 No. 11-67 Sur Zona Industrial', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '(57-8) 873 3918', NULL, NULL, NULL, NULL, NULL, 'J', NULL, 'SH', NULL, 'Cra. 5 No. 11-67 Sur Zona Industrial
Neiva, Huila - Colombia
(57-8) 873 3918 - 867 9959', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1735, 'Mitsui & Co Coffee Trading Brazil Ltda.', 'Mitsui Brazil - Santos', 'Rua do Comércio, 55 - 8º andar', 'Conjuntos 1 e 2', 'Edifício Rubiácea', 'Centro', 'Santos - SP', NULL, NULL, '11010-141', '(13) 3213-2630', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, NULL, '34.292.849/0001-06', NULL, '633.881.925.110', true, 7, 2, NULL, NULL, NULL, NULL),
(1069, 'Nethgrain B.V.', NULL, 'Westblaak 92 - Cometongebouw', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '31 10 411 0485', NULL, '31 10 413 0432', NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, 'Louis Dreyfus Commodities
Rua do comércio, 18/20
Cep: 11010-140
CNPJ: 47.067.525/0006-12
IE: 633.011.540.113', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(23, 'NICCHIO SOBRINHO CAFE S/A', NULL, 'Rod. Gether Lopes de Farias', '2528', 'SL 02', NULL, 'COLATINA', NULL, 'ES', '29705-200', '27 4009-9900', NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'SH', NULL, 'corrigir a razão para NICCHIO SOBRINHO CAFÉ S/A


SEMPRE COLOCAR NA NOTA FISCAL 
inclui cód de serviço 10.09', '27.487.131/0001-00', NULL, '080.082.220', true, NULL, 9, NULL, NULL, NULL, NULL),
(20, 'NKG Stockler LTDA', 'Stockler Vitória', 'Av. Nossa Sra. dos Navegantes, 675', NULL, NULL, NULL, 'Praia do Suá, Vitória - ES', NULL, NULL, '29050-335', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'SH', NULL, 'Centro do Comercio de Café de Vitoria, CCCV
Av. Nossa Sra. dos Navegantes, 675 - Sala 107/108
Praia do Suá, Vitória - ES, 29050-335', '23.226.483/0001-42', NULL, '647.560.442.0057', true, NULL, 7, NULL, NULL, NULL, NULL),
(1873, 'NKG Stockler Ltda.', 'NKG Stockler Ltda', 'Avenida José Ribeiro Tristão, 105', NULL, 'Varginha, MG', NULL, '37031-075', NULL, NULL, NULL, '55 35 3197-1120', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, 'NKG Stockler Ltda.
Avenida José Ribeiro Tristão, 105
37031-075 Varginha · Brazil', '61.620.753/0016-70', NULL, '432.374.185-0628', true, 7, 7, NULL, NULL, NULL, NULL),
(1211, 'NUTRADE COMERCIAL EXPORTADORA LTDA', 'NUTRADE COMERCIAL EXPORTADORA LTDA', 'AV. NACOES UNIDAS  -', '18.001', '5° ANDAR', NULL, 'SAO PAULO', NULL, 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, NULL, '52.733.714/0001-02', NULL, '110.952.228.111', true, 2, 7, NULL, NULL, NULL, NULL),
(1299, 'O''Coffee Estate Coffees', 'O''Coffee Estate Coffees', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, NULL, NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1548, 'OLAVO DE CARVALHO JUNIOR', 'OLAVO DE CARVALHO JUNIOR', 'Fazenda Monte Alto', NULL, NULL, NULL, 'Araxá', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'SH', NULL, NULL, NULL, '446.867.146-72', '0011.296.430-286', true, 2, 2, NULL, NULL, NULL, NULL),
(949, 'Outspan Brasil Imp. e Exp. Ltda.', 'Outspan', 'Rua Frei Gaspar', '22', '6º floor', NULL, 'SANTOS', 'Brazil', 'SP', '11010-090', '133213-5200', NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'SH', NULL, 'Thiago dos Anjos

Mudança d razao social:
Olam Agrícola Ltda.

CNPJ e IE : o mesmo', '07.028.528/0001-18', '168.545-3', '633.616.432.111', true, NULL, 4, NULL, NULL, NULL, NULL),
(1208, 'Primavera Agronegocios Ltda.', 'Fazenda Primavera', 'Fazenda Primavera', 'S/N', NULL, 'Zona Rural', 'Angelândia', NULL, 'MG', '39685-000', '(33) 3516-1499', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, NULL, '13.050.677/0001-86', NULL, '001741270022', true, 7, 2, NULL, NULL, NULL, NULL),
(1194, 'Proud Comércio e Indústria Ltda.', 'Proud', 'Av. das Americas,', '700', 'Loja 110H', 'Barra da Tijuca', 'Rio de Janeiro', 'Brazil', 'RJ', '22640-100', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, 'Mr. Silvio Leite', NULL, NULL, NULL, false, 7, 7, NULL, NULL, NULL, NULL),
(1399, 'SANTOS & MELLO CORRETORA DE CAFE LTDA', 'DAVID CORRETORA', 'Rua do Comercio', '26', NULL, NULL, 'Santos', NULL, 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'SH', NULL, NULL, NULL, NULL, NULL, true, 2, 2, NULL, NULL, NULL, NULL),
(1869, 'StoneX Comercio e Exportaçao de Commodities Ltda', 'StoneX Comercio e Exportaçao de Commodities Ltda', 'Avenida Bailarina Selma Parada 505, sala 1401', NULL, 'Campinas  SP Brasil', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, 'StoneX Comercio e Exportaçao de Commodities Ltda
Avenida Bailarina Selma Parada 505, sala 1401, Campinas - SP 

luciano.gonzalez@stonex.com
raphael.morais@stonex.com
bruno.felipe@stonex.com
Brasil', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1170, 'T.B.I.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'SH', NULL, NULL, NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1183, 'Union Trading Comércio Importação & Exportação LTDA.', 'Union Trading', 'Rua Arizona,', '1.349', 'room 12A', 'Brooklin -', 'São Paulo / Brazil', NULL, 'SP', '04567-003', '(11) 5505-0212', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'SH', NULL, 'Union Trading Comercio Importação Exportação Ltda
AV: Hermenegildo Martini, 60 Perto da Pratelo 60
Jardim das Rosas - Espirito Sto do Pinhal - SP
Cep.. 13990-000
I.Estadual : 530.055.829.118
CNPJ 11.881.236/0001-09


Message received on January 03rd, 2013: 

Union Trading in São Paulo/SP:
 
We would like to inform you all that, our Departments: Administrative, 
Finance, Logistic and Comercial, from next Monday onwards, January 06th of 2014, will be located in the City of São Paulo, as per following address and phone below:
 
Union Trading, Comércio Importação e Exportação Ltda.
New address: Rua Arizona, nº1.349 - Sala: 12A (12º andar) 
Bairro: Brooklin, CEP: 04567-003; 
São Paulo/SP; 
Telephone: 55-11-5505-0212.', '11.881.236/0001-09', NULL, '633703840112', true, 7, 7, NULL, NULL, NULL, NULL),
(1303, 'CARLOS HENRIQUE MENEZES DE MENDONCA', 'CARLOS HENRIQUE MENEZES DE MENDONCA', 'FAZENDA LENHEIROS', NULL, NULL, NULL, 'Carmo do Paranaiba', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '07034566607', '0013098130032', true, 2, 1, NULL, NULL, NULL, NULL),
(1472, '(Antiga)Coop. dos Cafeicultores da Zona de Varginha Ltda', 'ANTIGA MINASUL', 'Rua Silvio Cougo, 680 - Vila Paiva', NULL, NULL, NULL, 'Varginha - MG / 37018-020', NULL, NULL, NULL, '(35) 3219-6900', NULL, NULL, NULL, NULL, 'adrian@minasul.com.br;mesadeoperacoes@minasul.com.br', 'J', 'CL', 'VE', NULL, 'De: Daiana Oliveira <daiana.oliveira@minasul.com.br> 
Enviada em: segunda-feira, 5 de abril de 2021 15:23
Assunto: RES: IMPORTANT M-0972/19 28522/19
Segue invoice ajustada em anexo. A razão social da Minasul 
alterou recentemente p/ Cooperativa Agroindustrial de Varginha 
LTDA. 
--------
New Bank - 08/05/2020
Banco do Brasil - New York Branch (686-6) 
535 Madison Avenue, 34th Floor 
New York, NY 10022 
ABA# 026003557 
SWIFT CODE: BRASUS33 
Account Number: 880000893
Customer Name: COOPERATIVA DOS CAFEICULTORES DA ZONA DE VARGINHA LTDA
----------
Shipper: COOPERATIVA AGROINDUSTRIAL DE VARGINHA LTDA
Address: JOAO ALVES DE MIRANDA - VILA PAIVA
37018-070 - VARGINHA - MG, BRAZIL
FDA REGISTRATION: 18160519606', '25.863.341/0001-11', NULL, '707.047486-0028', true, 7, 7, NULL, NULL, NULL, NULL),
(1661, '(COCAPIL) Cooperativa dos Cafeicultores e Agrop. de Ibiraci LTDA.', 'COCAPIL', 'Rua Ayksa Ramos, 51 - Centro', NULL, NULL, NULL, 'Ibiraci, MG - Brasil', NULL, NULL, '37990-000', '(35) 3544-5100', NULL, NULL, NULL, NULL, 'elvis@cocapil.com.br', 'J', 'CL', 'VE', 'Contact: Mr. Elvis Vilhena', 'Cooperativa dos Cafeicultores e Agrop. de Ibiraci LTDA
Rua Ayksa Ramos, 51 Centro
37990-000
04.486.184/0001-00
2.971.329.080.074
Ibiraci - MG - Brasil
(35) 3544-5100', '04.486.184/0001-00', NULL, '2.971.329.080.074', true, 7, 7, NULL, NULL, NULL, NULL),
(975, '3 J Comercial Agricola e Exportadora LTDA', '3J Com Agr. Exp', 'Rua Felisbino de Lima,', '1411', NULL, 'Cidade Nova', 'Franca', 'Brasil', 'SP', '14401-146', '(16) 3721-8504', NULL, NULL, '(16) 9999 - 699', NULL, NULL, 'J', 'CL', 'VE', NULL, 'João Henrique Ribeiro S. Borges', '11.174.181/0001-99', NULL, '310.465.987.114', true, NULL, 7, NULL, NULL, NULL, NULL),
(1382, 'AC Café S/A', 'AC Café S/A', 'Rua Araxá, 25 - Distrito Industrial', NULL, NULL, 'PO Box 91 /', 'Araxá - MG', NULL, NULL, '38180-305', '19 33677656', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'Contact.: Andreza Elaine Mazarão

AC Café S/A
Rua Araxá, 25 - Distrito Industrial
PO Box 91 / Araxá - MG', '16.674.969/0001-88', NULL, '002.136.843.03-25', true, 7, 7, NULL, NULL, NULL, NULL),
(612, 'ACACIO JOSÉ DIANIN', NULL, 'FAZ. SÃO JOSÉ L. VEREDA', NULL, NULL, NULL, 'ROMARIA', 'ROMARIA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, NULL, NULL, '582.220.309-49', '564/0550', true, NULL, NULL, NULL, NULL, NULL, NULL),
(398, 'ACÁCIO JOSÉ DIANIN', NULL, 'FAZ. UNIÃO', NULL, NULL, NULL, 'ROMARIA', 'ROMARIA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: AMOCA', NULL, '582.220.309-49', '564/0550', false, NULL, NULL, NULL, NULL, NULL, NULL),
(631, 'ACACIO TORATTI E OUTROS', NULL, 'FAZ. SEGREDO', NULL, NULL, NULL, 'SERRA DO SALITR', 'SERRA DO SALITR', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'ACAIA', NULL, '068.504.158-16', '667/1424', true, NULL, NULL, NULL, NULL, NULL, NULL),
(978, 'Acaiá do Cerrado Exp. de Café LTDA', 'Acaiá doCerrado', 'Av. Faria Pereira', '230', 'SALA 01', 'Boa Esperança', 'Patrocínio', 'Brasil', 'MG', '38740-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '07.542.647/0001-94', NULL, '481.402.070.0057', false, NULL, NULL, NULL, NULL, NULL, NULL),
(1114, 'Acaiá do Cerrado Exp. de Café LTDA.', 'Acaiá do Cerrado', 'Av. Faria Pereira,', '230', 'sala 1', 'Boa Esperança', 'Patrocínio', NULL, 'MG', '38740-000', '34 383117577', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '07.542.647/0001-94', NULL, '481.402.070-0057', true, NULL, 4, NULL, NULL, NULL, NULL),
(690, 'ACARAM - FAIR TRADE', 'ACARAM', NULL, NULL, NULL, NULL, NULL, NULL, 'RO', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1466, 'Acauã - Armazéns Gerais Ltda', 'Acauã - Armazens Gerais', 'BR 262 KM 678', NULL, NULL, NULL, 'Araxá', NULL, 'MG', '38180-540', '34 3664 3031', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'Acauã - Armazéns Gerais Ltda
BR 262 KM 678
Bairro Amazonas, Araxá - MG
CEP.: 38180-540', '23.999.732/0001-32', NULL, '0026.8979900-35', true, 8, 2, NULL, NULL, NULL, NULL),
(1632, 'ADALBERTO LUCIO DE OLIVEIRA', 'ADALBERTO LUCIO DE OLIVEIRA', 'Fazenda Pedras', NULL, NULL, NULL, 'Santa Rosa da Serra', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, 'CONTATO: NILSON', NULL, '501.172.546-49', '00169368-0014', true, 2, 2, NULL, NULL, NULL, NULL),
(860, 'Adeco Agropecuária Brasil S.A', 'AdecoAgro', 'Rod. BA 825, Km 32 - Fazenda Rio de Janeiro', NULL, 'Zona Rural', 'Barreiras', 'Bahia', 'Brasil', 'BA', '47850-000', '77 3628-5865', NULL, '77 36283585', NULL, NULL, NULL, 'J', 'CL', 'VE', 'sem certificação', 'Endereço para correspondência:
 
Rua Para, s/nr
Edificio Comercial Alvorada
Luis Eduardo Magalhaes - BA
Cep: 47850-000
Caixa postal 122
A/c: Simone Hipolito       (35) 35732835 

com certificação
Adeco Agropecuária Brasil S/A
Rod. BR 020, Km 10 - Zona Rural - Estrada do Café 
Fazenda Lagoa do Oeste Barreiras - BA
CNPJ: 07.035.004/0004-05
IE: 76.223.049

Dados bancários:
Banco Itaú S.A
Ag.: 0749
C/C: 56.850-7
CNPJ: 07.035.004/0001-54', '07.035.004/0003-16', NULL, '67.114.300', true, NULL, 7, NULL, NULL, NULL, NULL),
(1455, 'ADEMAR JOSÉ PINTO', 'ADEMAR JOSÉ PINTO', 'Estrada Candeias/Pires - Km 24', 'Sitio Ribeirao', 'do Salvador', NULL, NULL, NULL, 'MG', '37.280-000', NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '985.547.866-53', '001.184.641-0088', true, 2, 2, NULL, NULL, NULL, NULL);
