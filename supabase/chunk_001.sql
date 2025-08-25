-- Bulk import of all remaining legacy clients
INSERT INTO public.legacy_clients (
    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
    logo, logo_altura, logo_largura, auto_size
) VALUES
(1246, 'BR - Corretora', 'BR - Corretora', 'Rua XV de Novembro', '20', 'Sala F', 'Centro', 'Santos', 'Brazil', 'SP', NULL, '(13) 9713-5056', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1223, 'Brazil Coffee Cerealista Exp., Imp. e Comércio de Café', 'Brazil Coffee Cerealista', 'Rua Diogo Feijó', '1929', NULL, 'Estação', 'Franca', 'Brasil', 'SP', '14405-212', '(16) 3724-0044', NULL, NULL, NULL, 'julianojapaulo@cerealista.net.br', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1330, 'Byron Holcon', 'Byron Holcon', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1198, 'Café Direto Corretora de Café', 'Café Direto Corretora de Café', 'Rua Barão de Mota Pães', '675', NULL, NULL, 'Pinhal', 'Brasil', 'SP', NULL, '(19) 3661-5813', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1196, 'Café Nova Era LTDA.- Comércio de Café', 'Café Nova Era', 'Alameda Altino Osório de Oliveira', '170', NULL, 'Distrito Indústrial', 'Altinópolis', 'Brasil', 'SP', '14350-000', '(16) 3665-2721', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1469, 'Cafè Saula', 'Cafè Saula', 'Carrer de Laureà Miró', '424', NULL, 'Sant Feliu de Llobregat', 'Barcelona', 'Espanha', NULL, '08980', '+34936662698', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1799, 'Cafezal Consultoria', 'Cafezal Consultoria', 'Av. Santos Dumont', '584', NULL, 'Estação', 'Franca', 'Brasil', 'SP', '14405-268', '(16)3409-4441', NULL, NULL, NULL, 'cafezal@cafezalconsultoria.com.br', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1741, 'Carlos Thomaz Whately e Outros - Faz. Santa Cecília', 'Carlos Thomaz Whately e Outros - Faz. Santa Cecília', NULL, NULL, NULL, NULL, NULL, 'Brasil', 'MG', NULL, '(14)3512-2024', NULL, NULL, '(14)99135-7234', 'fsc2009@gmail.com', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1739, 'Casagrande Armazéns Gerais Ltda.', 'Casagrande Armazéns Gerais', 'Av. Rio de Janeiro', '221', '15º Andar', NULL, 'Londrina', 'Brasil', 'PR', '86.010-918', '(43)3323-8263', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1508, 'CEREJA COFFEE LTDA', 'CEREJA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 2, 2, NULL, NULL, NULL, NULL),
(1801, 'Cinco Grãos Comercialização e Armazenagem de Café', 'Cinco Grãos', 'Av. Capitão Firmino Rocha', 'S/N', 'Zona Rural', 'Zona Rural', 'Patrocínio Paulista', 'Brasil', 'SP', '14.415-000', '(16)3403-7923', NULL, NULL, '(16)99222-0117', 'cincograos.airton@gmail.com', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1306, 'Coffea Selection - Fazenda Mutuca', 'Coffea Selection - Fazenda Mutuca', 'Estrada unicipal CTP 019 KM 06', NULL, NULL, 'Zona Rural', 'Três Pontas', 'Brazil', 'MG', '37190-000', '(35) 3266-2150', NULL, NULL, NULL, 'specialtycoffees@coffeaselection.com', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1782, 'Coffee Soul - Milton', 'Coffee Soul - Milton', NULL, NULL, NULL, NULL, NULL, NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1165, 'Coocacer - Araguari', 'COOCACER Araguari', 'Rod. Araguari Indianópolis', '29', 'KM 1', NULL, 'Araguari', NULL, 'MG', '38446-306', '(34) 3242-6900', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, '71.428.874/0002-73', NULL, '035.866.295/0161', true, 8, 2, NULL, NULL, NULL, NULL),
(1879, 'Coocasse - Cooperativa dos Cafeicultores de São Sebastião da Estrela LTDA', 'Coocasse - Cooperativa dos Cafeicultores de São Sebastião da Estrela LTDA', 'Rua Rivalino Antonio de Barros', '22', NULL, 'São Sebastião da Estrela', 'Santo Antonio do Amparo', 'Brasil', 'MG', '37.262-000', '(35)99701-3690', NULL, NULL, '(35)99821-3513', 'financeiro@coocasse.com.br', 'fiscal@coocasse.com.br', 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1572, 'Cooperativa dos Produtores de Café Especial de Boa Esperança', NULL, 'Rua Gutemberg Moreira Leite', '45', NULL, 'Centro', 'Boa Esperança', 'Brasil', 'MG', '37.170-000', '(35) 3851-3314', NULL, NULL, '(35) 98884-3314', 'contato@costas5588.com.br', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1535, 'COOPERCITRUS - JACUI', 'COOPERCITRUS - JACUI', 'Avenida José Eduardo de Souza B', NULL, NULL, NULL, 'Jacuí', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, '45.236.791/0129-55', NULL, '702.202.218.13100', true, 2, 2, NULL, NULL, NULL, NULL),
(1520, 'COOPERVASS - Cooperativa Agro Pecuária do Vale do Sapucaí LTDA.', 'COOPERVASS', 'Av. Tiradentes', '360', NULL, 'Bairro Inconfidentes', 'São Gonçalo do Sapucaí', 'Brasil', 'MG', NULL, '(35) 3241-3165', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1536, 'COPERCITRUS- ANDRADAS', 'COPERCITRUS- ANDRADAS', 'Sitio São Benedito', 's/n', 'sala 1', NULL, 'Andradas', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, '45.236.791/0153-85', NULL, '702.202.181.5006', true, 2, 2, NULL, NULL, NULL, NULL),
(1350, 'Costa Comissária & Negócios em Café Ltda.', 'Costa Comissária de Café', 'Alameda do Café', '219', 'Sala 04 - Ed. do Café', NULL, 'Varginha', 'Brasil', 'mg', '37026-400', '(35) 3229-5500', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1421, 'Dinamo - Fred', 'Dinamo - Fred', 'Fazenda Iracema', NULL, NULL, NULL, NULL, 'Brasil', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1460, 'Diniz & Ewbank Green Coffee Export', 'Guilherme Diniz', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'dinizewbank.coffee@yahoo.com.br', 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1291, 'Efrain Botrel Alves', 'Efrain Botrel Alves', NULL, NULL, NULL, NULL, NULL, 'Brasil', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1805, 'Exata Corretora', 'Exata Corretora', 'Rua dos Antunes', '873', NULL, 'Centro', 'São Sebastião do Paraíso', 'Brasil', 'MG', '37.950-000', '(35)3531-1448', NULL, NULL, NULL, 'exatacorretora@exatacorretora.com.br', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1446, 'Fazenda Barinas', 'Fazenda Barinas', NULL, NULL, NULL, NULL, 'Araxa', 'Brasil', 'MG', '38.183-971', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1326, 'Fazenda Iracema', 'Fazenda Iracema', NULL, NULL, NULL, NULL, 'Machado', 'Brasil', 'MG', NULL, '(13)996391697', NULL, NULL, NULL, 'wolfensbuger4@gmail.com', 'wolfensbuger4@gmail.com', 'F', 'CL', NULL, NULL, 'Fred Wolfensbuger', NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1595, 'Fazenda Monte Alto', 'Fazenda Monte Alto', NULL, NULL, NULL, NULL, 'Guaxupe', 'Brazil', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1770, 'Fazenda Paradiso', 'Fazenda Paradiso', 'Estrada Municipal Santo Antônio do Amparo', 'S/N', 'Aeroporto', 'Zona Rural', 'Santo Antônio do Amparo', 'Brasil', 'MG', '37.262-000', '(21)98400-6185', '(31)8823-7533', NULL, '(35)9717-5033', 'marina.fazendaparadiso@gmail.com', NULL, 'J', 'CL', NULL, NULL, 'Estrada Municipal Santo Antonio do Amparo - Aeroporto, S/N Zona Rural', NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1363, 'Fino Grão Corretora de Café Ltda', 'Fino Grão Corretora de Café Ltda', 'Av. Alfredo Braga de Carvalho', '419 C', NULL, NULL, 'Varginha', NULL, 'MG', '37062-440', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'RE', NULL, NULL, NULL, '10.586.317/0001-05', NULL, NULL, true, 2, 2, NULL, NULL, NULL, NULL),
(1346, 'Font Coffee Comércio Exp. e Imp. de Café LTDA.', 'Font Coffee', 'Rua Governador Pedro de Toledo', '39', NULL, 'Monte Negro', 'Espírito Santo do Pinhal', 'Brasil', 'sp', '13990-000', '(19) 3651-8001', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1783, 'Forte Grão Com. Imp. e Exp. de Café LTDA.', 'Forte Grão - Exportação de Cafés', 'Rua Tuparai', '74', 'Sala 3 - Pav. Térreo', 'Residencial Teixeira', 'Alfenas', 'Brasil', 'MG', NULL, '(35)3292-5057', NULL, NULL, NULL, 'comercial@fortegrao.com', NULL, 'F', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1868, 'Fran Coffee - Representação Comercial LTDA', 'Fran Coffee - Representação Comercial LTDA', 'Rua José Fileto', '351', NULL, 'Jd. Francano', 'Franca', 'Brasil', 'SP', '14.405-076', '(16)98213-0008', NULL, NULL, NULL, 'francoffeefranca@gmail.com', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1830, 'Garça Armazéns Eirelli', 'Garça Armazéns Eirelli / Johnny Henrique', 'Av. Dr. Labiano da Costa Machado', '3689', NULL, 'Pq. Industrial', 'Garça', 'Brazil', 'SP', '17406-200', '(14)3471-0548', NULL, NULL, NULL, 'contato@garcaarmazens.com.br', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1420, 'GS Corretora de Café & Representações Ltda.', 'GS Corretora de Café & Representações Ltda.', 'Av. Vereador João Alegre', '85', NULL, 'Santa Terezinha', 'Campos Altos', 'Brasil', 'MG', '38.970-000', '(37) 3426-3428', NULL, NULL, NULL, 'gscorretorakz@hotmail.com', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1046, 'Icona Café', 'Icona', 'Caleruega 67', '28033', '8th floor', NULL, 'Madrid', 'Espanha', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'CL', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, 7, NULL, NULL, NULL, NULL),
(1055, 'IDD - Inter Dealership Develop.', 'IDD', 'Claredon Roadlondon W11 3AB', '18', NULL, NULL, NULL, 'England', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1059, 'Imperial Commodities Corp.', 'Imperial Commodities', 'Battery Place', '17', '10004-1102', NULL, 'New York', 'U.S.A', NULL, NULL, '0012128379424', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, 'Contact:
Mr. Fernando Velandia', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1162, 'Inter Kava Agronegócios', 'Inter Kava Agronegócios', NULL, NULL, NULL, NULL, 'Pinhal', 'Brazil', 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1087, 'Interway Coffee Division', NULL, 'Av. Princesa do Sul', '470', NULL, NULL, 'Varginha', NULL, 'MG', '37962-180', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, 'AIDC Tecnologia Ltda


Dados para emissão da nota:

AIDC Teconologia Ltda
Av. Princesa do Sul, 470 - sls. 207/208 - jardim Andere
37.062.180  Varginha - MG

CNPJ: 07.500.596/0002-19
IE: 324.356.378-0178
Inscrição Municipal: 17.959', NULL, NULL, NULL, false, NULL, 7, NULL, NULL, NULL, NULL),
(1448, 'Itapuan Coffees', 'Itapuan Coffees Produção Sustentável', 'Caixa Postal 9252', NULL, NULL, NULL, 'Alfenas', 'Brasil', 'MG', '37130-000', '(35) 3299-2255', NULL, NULL, NULL, 'adm@itapuancoffees.com.br', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1027, 'J.TH. DOUQUE''S KAFFEE BV.', NULL, 'Bijdorp 2 >1181 MZ Amstelveen, The Netherlands', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '31 20 622 24 77', NULL, NULL, NULL, NULL, ':\u0018�\u001c\u0003�ۛޫ��\u0016���\u0011���5���+M�tm���vL6i�\u001b��\f\u001f�EѼ_bE巈��+���W��+g���\/\u0017���J�U@\u0018\u0003\u0002��kl���F�Ɩ�xl|Cm6����W�yR��S\u000f���\rꢺ��]B��Q�����\u001b�YF׆d\u000e�=��\\�𶥢\r�\u000f՞\bT��3P&kR?����\/��?�h�^A�;jJ��|m\u0005���x��]\u0002��\u00185���\u001c��?F����Rqkq���QE!�\u0014Q@\u0005\u0014Q@\u0005\u0014U{˨', 'J', NULL, NULL, NULL, 'J.TH. DOUQUE''S KAFFEE BV.
DOUQUE''S
TOM DOUQUE

Maersk service number  56763



Bank details (28/09/2010)

ABN AMRO BANK N.V.
Commodities Agri Amsterdam
PRINS BERNHARDPLEIN 200
1097 JB  AMSTERDAM
NETHERLANDS', NULL, NULL, NULL, NULL, NULL, 12, '����\u0000\u0010JFIF\u0000\u0001\u0001\u0001\u0001', NULL, NULL, false),
(1166, 'João Batista Jarduli', 'Geagro', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '(35) 3265-7292', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1205, 'João Daniel', 'João Daniel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1284, 'Juruna Corretor', 'Juruna Corretor', NULL, NULL, NULL, NULL, 'Santos', 'Brasil', 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1216, 'Kampery Development Limited', 'Kampery', 'Flat 2-3, 4th Floor, 2-16 Kwai Fung Crescent,', NULL, 'Kwai Chung, N.T.', NULL, 'Hong Kong', 'China', NULL, '523477', '852-3181-4488', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 15, 15, NULL, NULL, NULL, NULL),
(1451, 'Khapé Industria e Comercio LTDA.', 'Khapé', 'Estrada Nova Floresta, KM 4 - Sitio Ibaté', NULL, NULL, NULL, 'Guaxupé', 'Brazil', 'MG', NULL, '(35) 3552-5037', '(11) 3912-2171', NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1219, 'Lessa Corretora De Mercadorias LTDA.', 'Lessa Corretora De Mercadorias LTDA.', 'Rua do Cómercio de Café', '111', NULL, 'Industrial Reinaldo Foresti', 'Varginha', 'Brasil', 'MG', '37026-530', '(35)2106-1599', NULL, NULL, NULL, NULL, NULL, 'J', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1290, 'Manga Coffee Corporation', 'Manga Coffee Corporation', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'skype: mangajoao', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1220, 'MD Coffee Representações Comerciais LTDA.', 'MD Coffee Representações Comerciais LTDA.', 'Rua Silvio Braga Araujo', '128', 'Sala 1', 'Batuque', 'Monte Carmelo', 'Brasil', 'MG', '38500-000', '(34)3842-1492', NULL, NULL, NULL, 'mdcoffeerepresentacoes@hotmail.com', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1234, 'Octavios Café', 'Octavios Café', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 12, 12, NULL, NULL, NULL, NULL);
