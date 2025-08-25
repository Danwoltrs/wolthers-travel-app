-- Bulk import of all remaining legacy clients
INSERT INTO public.legacy_clients (
    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
    logo, logo_altura, logo_largura, auto_size
) VALUES
(1398, 'COOP. DOS CAFEIC. DO CERRADO - MONTE CARMELO LTDA', 'COOP. MONTE CARMELO', 'Rodovia MG 190 KM 04', NULL, NULL, 'Zona Rural', 'Monte Carmelo', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '00.650.386/0001-87', NULL, '431.741.431.0004', true, 2, 2, NULL, NULL, NULL, NULL),
(1519, 'Coop. Mista Agropecuária de Paraguaçu Ltda.', 'Coomap.', 'Av. Orlando Alves Pereira, 240', NULL, NULL, NULL, 'Paraguaçu', NULL, 'MG', NULL, '(35)32674600', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'Cooperativa Mista Agropecuária de Paraguaçu Ltda.
Av. Orlando Alves Pereira, 240
Distrito Industrial
Paraguaçu - MG
E-MAIL: gerente.negocios@coomap.com.br e
rafael.furtado.fonseca@gmail.com
cafe@coomap.com.br 
qualidade.cafe@coomap.com.br', '23.176.936/0002-54', NULL, '4720612480182', true, 7, 2, NULL, NULL, NULL, NULL),
(1315, 'COOP. MISTA DOS PRODUT. RURAIS DE BOM SUCESSO LTDA', 'COOP. MISTA DOS PRODUT. RURAIS DE BOM SUCESSO LTDA', 'Rod. MG 332 - Km 19', NULL, NULL, NULL, 'Bom Sucesso', NULL, 'MG', '37.220-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '16.736.928/0006-83', NULL, '080.280.986-0535', true, 2, 2, NULL, NULL, NULL, NULL),
(1144, 'COOP. PIRAJU', 'COOP. PIRAJU', 'Rua General Camara', '5', 'andar 13 sala 1305', 'Centro', 'Santos', 'Brasil', 'SP', '11010-121', '(13) 3219-3469', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1454, 'COOP. PROD. LEITE DO MUNIC. DE BOM SUCESSO MG LTDA', 'COOP. BOM SUCESSO', 'Rua Deputado Cunha Bueno', '25', 'Industriais', NULL, 'Bom Sucesso', NULL, 'MG', '37220-000', NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, '08.112.721/0002-86', NULL, '001.0099-6601-05', true, 2, 2, NULL, NULL, NULL, NULL),
(223, 'COOP. REG. AGROP. SANTA RITA DO SAPUCAÍ', NULL, 'ROD. BR 459', 'KM 121', NULL, 'FEBEM', 'SANTA RITA DO S', 'SANTA RITA DO S', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CONTATO: DAVID CORRETORA', '24.490.401/0010-26', NULL, '596.060.134.0469', true, NULL, NULL, NULL, NULL, NULL, NULL),
(257, 'COOP. REG. DOS CAFEIC. DE S.S. DO PARAÍSO', NULL, 'RUA MAJOR GARCIA', '848', NULL, NULL, 'ALTINÓPOLIS', 'ALTINÓPOLIS', 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CONTATO: CAIO', '24.896.409/0024-92', NULL, '159.007.146-119', true, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'Coop. Reg. dos Cafeic. de São Sebastião do Paraíso LTDA.', 'Cooparaíso', 'Rua Carlos Mumic,', '140', NULL, NULL, 'São Sebastião do Paraíso', NULL, 'MG', '37950-000', '13 3219-7570', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'Nicolly Almeida
aol: almeidanic  skype: nicalmeida 
msn: nicollybrazuka@hotmail.com
35 9919-8185', '24.896.409/0001-04', NULL, '647.030.846.0096', true, NULL, 15, NULL, NULL, NULL, NULL),
(1056, 'COOP. REG. DOS CAFEICULTORES DE POÇOS DE CALDAS', 'COOP. REG. DOS CAFEICULTORES DE POÇOS DE CALDAS', 'AV. JOÃO PINHEIRO', '757', NULL, NULL, 'POÇOS DE CALDAS', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'COOP. REGIONAL DOS CAFEICULTORES DE POÇOS DE CALDA
COOP. DE POÇOS
CRISTIANO OTTONI', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1054, 'Coop. Regional de Cafeicultores em Guaxupé Ltda.', 'Cooxupé', 'Rua Frei Gaspar, 24/26 -', NULL, '5th floor', 'Centro - Santos, Brasil', NULL, '11010-090', NULL, NULL, '013 32137469', NULL, '013 32196167', NULL, NULL, NULL, 'J', 'CL', 'VE', 'FDA:19095334214

eComex Portal - usuário: wolthers / senha: w762495a', 'No commission from Cooxupe to Wolthers & Associates in this contract.


Message received on July 31st, 2019:
From now on, due to our internal business relations, all payments to Cooxupe must be sent to:
 
STANDARD CHARTERED BANK - NEW YORK
One Madison Avenue - ZIP CODE 10010-3603
New York, NY - USA
Swift Code: SCBLUS33
Beneficiary: BANCO ITAÚ BBA S.A. - NASSAU BRANCH -
Swift Code: CBBABSNSBNF account: 3544-030209-001
Final Beneficiary: COOP REGIONAL DE CAFEIC EM GUAXUPE LTDA COOXUPE

OR

CITIBANK NA - New York
111 Wall Street - ZIP CODE 10043
New York, NY - USA
Swift Code NY: CITIUS33  -  Account nr. 36248067 - ABA021000089
To credit of: BANCO CITIBANK S.A. 
Beneficiary: COOP REGIONAL DE CAFEIC EM GUAXUPE LTDA COOXUPE', '20.770.566/0011-81', '074.29.15', '633.203.360.113', true, NULL, 7, NULL, NULL, NULL, NULL),
(341, 'COOP. REGIONAL DOS CAFEIC. DE POÇOS DE CALDAS', NULL, 'AV. JOÃO PINHEIRO', '757', NULL, NULL, 'POÇOS DE CALDAS', 'POÇOS DE CALDAS', 'MG', '37.701-387', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CONTATO: BOURBON COFFEE', '23.641.822/0001-57', NULL, '518.027.982.0032', true, NULL, NULL, NULL, NULL, NULL, NULL),
(164, 'COOPADAP -LTDA', 'COOPADAP -LTDA', 'AV. ERTIDES BATISTA', '10', 'SALA 1', NULL, 'SÃO GOTARDO', 'SÃO GOTARDO', 'MG', NULL, NULL, NULL, '(34) 6716115', NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CONTATO: HEDING', '86.875.642/0001-06', NULL, '621.905.937.0082', true, NULL, NULL, NULL, NULL, NULL, NULL),
(373, 'COOPERATIVA AGROP.', NULL, 'AV. JOÃO BATISTA DA SILVA', '398', NULL, NULL, 'CARMO DO PARANA', 'CARMO DO PARANA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CONTATO: QUENIO', '19.445.733/0001-68', NULL, '143.074.200.0052', true, NULL, NULL, NULL, NULL, NULL, NULL),
(916, 'Cooperativa dos Cafeicultores da Zona de Três Pontas Ltda', 'COCATREL', 'Avenida Urbano Garcia Neto, 680', NULL, 'Santa Margarida - Três Pontas (MG)', NULL, NULL, NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', 'sidnei.tsukayama@cocatrel.com.br
chicopereira@cocatrel.com.br
export@cocatrel.com.br', 'Rua Bento de Brito, 110
Três Pontas | Minas Gerais
CEP: 37190-000

sidnei.tsukayama@cocatrel.com.br
chicopereira@cocatrel.com.br
export@cocatrel.com.br

Cooperativa dos Cafeicultores da Zona de Três Pontas Ltda
Avenida Urbano Garcia Neto, 680 - bairro Santa Margarida 
Três Pontas (MG)', '25.266.685/0001-43', NULL, '694.078.489-0037', true, NULL, 7, NULL, NULL, NULL, NULL),
(825, 'Cooperativa Regional de Cafeicultores em Guaxupé Ltda.', 'Cooxupé', 'Rua Manoel Gonçalves Ferraz, 356', NULL, NULL, NULL, 'Guaxupé / MG', '- Brasil', NULL, '37.800-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '20.770.566/0005-33', NULL, '287.048.636-0415', true, NULL, 2, NULL, NULL, NULL, NULL),
(1371, 'COOPERBELO-COOP. AGRIC. DOS CAFEIC. DA REG. DE CAMPO BELO', 'COOPERBELO', 'Rua Antonio Moreira Maia', '205', NULL, 'Vila Matilde', 'Campo Belo', NULL, 'MG', '37270-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'andre.soares28@hotmail.com', '18.862.382/0001-28', NULL, '002.221.751.0096', true, 2, 2, NULL, NULL, NULL, NULL),
(1767, 'COOPERCAM - Coop. dos Cafeicultores de Campos Gerais e Campo do Meio.', 'COOPERCAM', 'Av. Dr. Alfredo Barbalho Cavalcanti, 505', NULL, 'Barro Preto,  Campos Gerais - MG', NULL, '37160-000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', 'classificacao@coopercam.com.br
rosemeire@coopercam.com.br', 'COOPERCAM
Cooperativa dos Cafeicultores de Campos Gerais e Campo do Meio LTDA.
Av. Dr. Alfredo Barbalho Cavalcanti, 505, Barro Preto
CEP: 37160-000 - Campos Gerais - Minas Gerais - Brasil', NULL, NULL, NULL, true, 7, 2, NULL, NULL, NULL, NULL),
(1537, 'COOPERCITRUS - ANDRADAS', 'COOPERCITRUS - ANDRADAS', 'Sitio São Benedito', 's/n', 'sala 1', NULL, 'Andradas', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '45.236.791/0153-85', NULL, '702.202.181.5006', true, 2, 2, NULL, NULL, NULL, NULL),
(1556, 'COOPERCITRUS - COOP. PRODUTORES RURAIS', 'COOPERCITRUS', 'ROD. BR 491 KM 6', 'S/N', NULL, NULL, 'S.S. PARAISO', NULL, 'MG', '37.950-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '45.236.791/0115-50', NULL, '702.202.181-1876', true, 2, 2, NULL, NULL, NULL, NULL),
(1394, 'Coopercitrus - Cooperativa de Produtores Rurais', 'Coopercitrus - Bebedouro', 'Praça Barão do Rio Branco, 9', NULL, NULL, NULL, 'Bebedouro - SP', NULL, NULL, '14.700-129', '(17) 3344-5200', NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'VE', NULL, 'Coopercitrus - Cooperativa de Produtores Rurais
Praça Barão do Rio Branco, 9
Bebedouro - SP 14.700-129', NULL, NULL, NULL, true, 8, 7, NULL, NULL, NULL, NULL),
(1064, 'COOPERNOVA - COOP. AGROP. DA REGIÃO DA MANTIQUEIRA', 'MANTIQUEIRA', 'RUA SÃO JOÃO', '48', '54', 'CENTRO', NULL, NULL, NULL, '13870-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'COOPERNOVA - COOP. AGROP. DA REGIÃO DA MANTIQUEIRA
COOPERNOVA', '02.982.392/0001-67', NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(769, 'COOPFAM -  COOP.  AGRIC.  FAMILIARES DE POÇO FUNDO', 'COOP', 'RUA ODETE DOS ANJOS FERREIRA', '43', NULL, NULL, 'POÇO FUNDO', 'POÇO FUNDO', 'MG', '37757-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, NULL, '06.238.484/0001-98', NULL, '517.302.554-0073', true, NULL, NULL, NULL, NULL, NULL, NULL),
(771, 'COPACAFE - COOP. DOS PEC. AGRIC E CAF. DE MG', 'COPACAFE', 'AV. DIMAS RESENDE', '240', NULL, 'JOÃO XXIII', 'PERDÕES', 'PERDÕES', 'MG', '37260-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CNPJ: DA CONTA 20.484.283/0015-05', '20.484.283/0001-00', NULL, '062.271.640-0007', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1286, 'COPERLAM - COOP. AGROP. DA REG. SUL DE MINAS E ALTA MOGIANA LTDA', 'COPERLAM', 'Rua Dr. Jose Mambrini,', '605', 'sala 3', NULL, 'Sao Sebastiao do Paraiso', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '06.878.792/0003-40', NULL, '65.130.943.202-14', true, 2, 2, NULL, NULL, NULL, NULL),
(433, 'COPERMONTE - COOP. AGRICOLA DE MONTE CARMELO', 'COOPERMONTE', 'ROD. MG 190 KM 3,2', NULL, NULL, NULL, 'MONTE CARMELO', 'MONTE CARMELO', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CONTATO: AMOCA', '00.699.115/0004-69', NULL, '431.936.529.0302', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1724, 'CORNELIA MARGOT GAMERSCHLAG', 'CORNELIA MARGOT GAMERSCHLAG', 'Faz. Palmeira', NULL, NULL, NULL, 'Santa Mariana', NULL, 'PR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, 'PEDRO', '015.650.688-23', '952.48060-00', NULL, true, 2, 2, NULL, NULL, NULL, NULL),
(1822, 'Corporación de Fincas Ecológicas, S.A.', 'Corporación de Fincas Ecológicas', '6A Calle 0-33 Zona 3 Residenciales del Valle', NULL, 'Esquipulas/Chiquimula, Guatemala', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'Mr. Hector Gonzales


De: Tom Sullivan <tom@wolthers.com> 
Enviada em: terça-feira, 20 de fevereiro de 2024 13:54
Para: Contracts <contracts@wolthers.com>

Exporter details:

Name: Corporacion de Fincas Ecologicas, S.A.
Address: 6A Calle 0-33 Zona 3 
Residenciales del Valle, Esquipulas/Chiquimula, Guatemala', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(627, 'COSMO DAMIÃO DA SILVA E OUTRO', NULL, 'FAZ. VISTA ALEGRE', NULL, NULL, NULL, 'PATROCINIO', 'PATROCINIO', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'ACAIA', NULL, '042.097.536-53', '481/4517', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1139, 'COXCAFE VARGINHA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, NULL, NULL, NULL, true, 2, 2, NULL, NULL, NULL, NULL),
(1089, 'Custodio Forzza Com. e Exp. Ltda.', 'C.FORZZA', 'AV. N. SENHORA DOS NAVEGANTESNR. 675 - CONJ. 1401/', '1409', NULL, 'Enseada do Suá', 'Vitoria', NULL, 'ES', '29056-900', '027 3089-2444', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '31.803.604/0002-80', NULL, '080.656.13-7', true, NULL, 15, NULL, NULL, NULL, NULL),
(299, 'CYRO ROBERTO MARINONI', NULL, 'FAZ. SÃO VICENTE', NULL, NULL, NULL, 'ÀGUAS DA PRATA', 'ÀGUAS DA PRATA', 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO:', NULL, '059.012.516-87', '015400393/000', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1142, 'D G DA SILVA - CAFE', 'D G DA SILVA - CAFE', 'Av. Tancredo Neves', '485', NULL, 'Baixada', 'Manhuaçu', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '13.603.243/0001-66', NULL, '001.768.840-0007', true, 2, 2, NULL, NULL, NULL, NULL),
(1175, 'D.F. TEODORO', NULL, 'Av. Barao do Rio Branco', '181', 'sala 01', NULL, 'Manhuaçu', NULL, 'MG', '36900-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '10.466.322/0001-84', NULL, '001.098.837-0077', true, 2, 2, NULL, NULL, NULL, NULL),
(1137, 'DALTON DIAS HERINGER', 'DALTON  DIAS HERINGER', 'Fazenda Martins Soares', NULL, NULL, NULL, 'Martins Soares', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, '001.116.144.02-24', '71.645.997-34', NULL, true, 2, 9, NULL, NULL, NULL, NULL),
(1143, 'Dalton Dias Heringer', 'Dalton', 'Fazenda Neblina', NULL, NULL, NULL, 'Itatiba', NULL, 'ES', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '71.645.997-34', '110.294.55-6', true, 2, 2, NULL, NULL, NULL, NULL),
(1173, 'DALTON DIAS HERINGER', 'HERINGER', 'FAZENDA DO FAMA', NULL, NULL, NULL, 'IÚNA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '71.645.997-34', '110.412.41-9', true, 2, 2, NULL, NULL, NULL, NULL),
(1695, 'DANIEL MESSIAS RODRIGUES', 'DANIEL MESSIAS RODRIGUES', 'Faz. Uruburetama', NULL, NULL, NULL, 'Campos Altos', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, 'NILSON', NULL, '075.089.546-29', '002.512.274-0003', true, 2, 2, NULL, NULL, NULL, NULL),
(1349, 'DANIEL PEREIRA - MULTIMAX', NULL, NULL, NULL, NULL, NULL, 'SAO SEBASTIAO DO PARAISO', NULL, 'MG', NULL, NULL, NULL, NULL, '35-88831102', NULL, NULL, 'F', 'RE', 'VE', NULL, NULL, NULL, NULL, NULL, true, 2, 2, NULL, NULL, NULL, NULL),
(1328, 'DANILO BARBOSA', 'DANILO BARBOSA', 'Fazenda Santa Fé', NULL, NULL, NULL, 'Serra do Salitre', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '239.064.306-00', '001.142821-0237', true, 2, 2, NULL, NULL, NULL, NULL),
(663, 'DANILO BARBOSA', 'DANILO BARBOSA', 'Rua Agostinho de Deus  789', NULL, NULL, NULL, 'Carmo do Paranaiba', NULL, 'MG', '38840000', NULL, NULL, NULL, '3499643296', NULL, NULL, 'F', 'CL', 'VE', NULL, 'COOCACER', 'M3.410.785SSPMG', '239.064.306-00', '0011428210075', true, NULL, 2, NULL, NULL, NULL, NULL),
(198, 'DANILO DE CASTRO', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: INCOFEX', NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL),
(979, 'Daterra Atividades Rurais Ltda', '- Zona Rural', 'Fazenda Boa Vista - Patrocinio/ MG', NULL, 'Rodovia MG 188 KM 16 - Zona Rural', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'DATERRA ATIVIDADES RURAIS 
Av. Anton Von Zuben, 2155
Jardim S. José - cAMPINAS/sp
Cep 13051-145 - (19)3728-8304
CNPJ 51.894.202 0001-65
IE 244.242.118.111


Daterra Atividades Rurais Ltda
Fazenda Boa Vista -  Patrocinio - MG
Rodovia MG 188 KM 16 - Zona Rural 
Cep: 38-740-000

Fone/Fax : (34) 3839-8500 / 3839-8501

CNPJ:51.894.202/0007-50
I.Produtor: 481/3683', NULL, NULL, NULL, true, NULL, 4, NULL, NULL, NULL, NULL),
(29, 'DAVI OTTONI FILHO', 'OTTONI', 'FAZ. VEREDA', NULL, NULL, NULL, 'SÃO GOTARDO', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: CARLINHOS', NULL, '010.114.566-72', '555/1435', true, NULL, NULL, NULL, NULL, NULL, NULL),
(40, 'DAVI OTTONI FILHO', NULL, 'FAZ. LIMEIRA', NULL, NULL, NULL, 'CONCEIÇÃO APARE', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: CRISTIANO', NULL, '010.114.566-72', '171/0418', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1643, 'Davi Sálvio  Domingo de Souza e Outros', 'Davi Sálvio  Domingo de Souza e Outros', 'Fazenda Chapadão', NULL, NULL, NULL, 'Pratinha', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '539.198.666-49', '0018093900071', false, 2, 2, NULL, NULL, NULL, NULL),
(1311, 'DAVI SALVIO DOMINGOS DE SOUZA E OUTROS', 'DAVI SALVIO DOMINGOS DE SOUZA E OUTROS', 'Fazenda Chapadão', NULL, NULL, NULL, 'Pratinha', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '539.198.666-49', '001809390-0071', true, 2, 2, NULL, NULL, NULL, NULL),
(149, 'DECIO BRUXEL', 'DECIO BRUXEL', 'Faz. São Joao', NULL, NULL, NULL, 'Varjão de Minas', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, 'CONTATO: CAIO', NULL, '085.132.440-15', '001157576-0258', true, NULL, 2, NULL, NULL, NULL, NULL),
(1763, 'DELCIO FERREIRA DE ARAUJO', 'DELCIO FERREIRA DE ARAUJO', 'Faz. Aroeira', NULL, NULL, NULL, 'Alterosa', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '266.334.936-49', '001192847-0048', true, 8, 8, NULL, NULL, NULL, NULL),
(487, 'DENER JORDÃO', 'DENER JORDÃO', 'FAZ. JULIANA', NULL, NULL, NULL, 'MONTE CARMELO', 'MONTE CARMELO', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'AMOCA', NULL, '016.463.089-99', '431/2418', true, NULL, NULL, NULL, NULL, NULL, NULL),
(238, 'DIOGO TUDELA NETO', 'DTN', 'FAZENDA CASTELHANA- ROD. BR 365', 'KM 526', 'CAIXA POSTAL 57', NULL, 'MONTE CARMELO', NULL, 'MG', '38500-00', NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: AMOCA', NULL, '029.158.208-72', '0013796200079', true, NULL, 2, NULL, NULL, NULL, NULL);
