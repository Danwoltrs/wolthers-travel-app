-- Bulk import of all remaining legacy clients
INSERT INTO public.legacy_clients (
    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
    logo, logo_altura, logo_largura, auto_size
) VALUES
(157, 'TOMIO FUKUDA', 'TOMIO FUKUDA', 'FAZENDA BAÚ', NULL, NULL, NULL, 'LAGOA FORMOSA', 'LAGOA FORMOSA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: CAIO - CORET.', NULL, '361.963.559-53', '375/1417', true, NULL, NULL, NULL, NULL, NULL, NULL),
(939, 'TORC-TERRAPLENAGEM OBRAS ROD. E CONSTRUTORA LTDA', 'TORC', 'ROD. MUNIC. AO RIO PRATA KM 36 S/N', NULL, NULL, NULL, 'POSSE', 'POSSE', 'GO', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'SAAG', '17.216.052/0018-40', NULL, '102.3465-2046', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1513, 'Torrefação Fazenda Progresso Ltda', 'Torrefação Fazenda Progresso Ltda', 'Rod BA 142, KM 227', NULL, 'Mucugê, BA - Brazil', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'CONTACT: Mr. Sivio Leite

CEP.: 46750-000', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1154, 'Tote Corretora de Mercadorias', 'Tote Corretora de Mercadorias', 'Desembargador Jorge Fontana', '80', '1401', 'Belvedere', 'Belo Horizonte', 'Brasil', 'MG', '30320-670', '(31)2514-1002', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(660, 'TRANSAGRO S/A', 'TRANSAGRO S/A', 'FAZ. TRANSAGRO', NULL, NULL, NULL, 'RIO PARANAIBA', 'RIO PARANAIBA', 'MG', NULL, '(34)38551426', NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'RONALDO CYPESTRE', '19.767.631/0001-69', '0', '001.129.602-0088', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1163, 'Três Corações Alimentos S.A.', 'Três Corações Alimentos', 'Rua Santa Clara', '100', NULL, 'Parque Santa Clara Eusébio', 'Eusébio', NULL, 'CE', '61760-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', NULL, 'VE', NULL, NULL, '63.310.411/0001-01', '01.01.01.0333', '068645090', true, 7, 2, NULL, NULL, NULL, NULL),
(1625, 'TULIO PEREIRA', 'TULIO PEREIRA', 'Faz. Virginia', NULL, NULL, NULL, 'Araxa', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', 'DATA DE NASCIMENTO: 27/06/1942.', NULL, NULL, '036.751.576-87', '001.336.283-0064', true, 2, 2, NULL, NULL, NULL, NULL),
(1295, 'TULIO TAFT BOVARETTO', 'TULIO TAFT BOVARETTO', 'Fazenda São Pedro', NULL, NULL, NULL, 'Ibia', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '70987289691', '01170840035', true, 2, 2, NULL, NULL, NULL, NULL),
(726, 'ULISESS POSSO E OUTROS', 'ULISSES', 'FAZ. RANCHARIA L. BURITIS', NULL, NULL, NULL, 'MONTE CARMELO', 'MONTE CARMELO', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'AMOCA', NULL, '042.203.319-72', '431/2389', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1546, 'Ungi Café Comércio, Indústria e Exportação Ltda.', 'Café Bento Grão', 'Rodovia BR 265 nº 1300', NULL, 'Charquinho, Lavras - MG', NULL, '37200-000', NULL, NULL, NULL, '(35) 3826-0471', '3822-7813', NULL, NULL, NULL, 'nardilene@cafebentograo.com.br', 'J', 'CL', 'VE', 'www.cafebentograo.com.br', 'Dados cadastrais:
 
Razão Social: Ungi Café Comércio, Indústria e Exportação Ltda.
CNPJ: 08.880.374/0001-50
I.E. 001.037.876.00-92
Endereço: Rodovia BR 265 nº 1300 - Charquinho - Lavras - MG - 37200-000
Telefone(s): (35) 3826-0471 / 3822-7813
Contato: Mrs. Nardilene Rebonato

Account with: JPMorgan Chase Bank, N.A
Swift Code: CHASUS33
Account nr: 544705690
In favor of Itaú Unibanco S.A.
Swift code: ITAUBRSP
For further credit to: Ungi Café Comércio, Indústria e Exportação Ltda.
Branch number: 7422 
Account number: 04400-3
IBAN: BR18 6070 1190 0742 2000 0044 003C 1', '08.880.374/0001-50', NULL, '001.037.876.00-92', true, 7, 7, NULL, NULL, NULL, NULL),
(362, 'UNIÃO COOP. AGROPECUÁRIA SUL DE MINAS - UNICOOP', NULL, 'RUA JOSÉ DOCE', '57', NULL, 'SANTANA', 'TRÊS PONTAS', 'TRÊS PONTAS', 'MG', '37.190-000', '(35) 32651364', NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CONTATO:', '86.541.596/0001-52', NULL, '694.890.816.0032', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1093, 'Unicafé Cia de Com. Exterior.', 'Unicafé', 'Rua São Bento nº 08 -', '19th floor', NULL, NULL, 'Rio de Janeiro, RJ', 'CEP 20090-010.', NULL, NULL, '(21) 2159-8989', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'UNICAFE CIA DE COM. EXTERIOR
UNICAFE
TRADING DEPARTMENT

Rua Do Comércio, 41
Centro - Santos - SP
Tel. 2102-8787

28.154.680/0003-89

UNICAFÉ - Rio de Janeiro
Rua São Bento, 8 - 19o andar - Centro
Rio de Janeiro - RJ
CEP 20090-010
tel. (21) 2159-8989', '28.154.680/0003-89', '39.220', '633.058.244.115', true, NULL, 7, NULL, NULL, NULL, NULL),
(521, 'UNICOOP - TRÊS PONTAS', NULL, 'ROD. TRÊS PONTAS - KM 01', NULL, NULL, NULL, 'VARGINHA', 'VARGINHA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, NULL, '86.541.596/0001-52', NULL, '694.890.816-0032', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1155, 'Unimesp Agropecuaria', 'Unimesp Agropecuaria', NULL, NULL, NULL, NULL, NULL, 'Brasil', 'SP', NULL, '(14) 3342-1965', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(673, 'UNIPASV - UNIÃO DOS PEQ AGRIC DE SANTANA DA VARGEM', 'SANTANA DA VARG', 'AV. TRÊS PONTAS', '61', NULL, NULL, 'SANTANA DA VARGEM', 'SANTANA DA VARGEM', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, NULL, '03.935.021/0001-27', NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(543, 'USSO CAFÉ - COM. E EXP. DE CAFÉ E CEREAIS LTDA', 'USSO', 'AV. GOVERNADOR ROBERTO DA SILVEIRA', '110', NULL, NULL, 'APUCARANA', 'APUCARANA', 'PR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, NULL, '79.100.798/0001-01', NULL, '636.00125-20', true, NULL, NULL, NULL, NULL, NULL, NULL),
(283, 'VALDIR CARVALHO DE RESENDE', NULL, 'FAZ. SEDRO', NULL, NULL, NULL, 'CONCEIÇÃO APARE', 'CONCEIÇÃO APARE', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: ALFENAS CAFÉ', NULL, '026.950.736-15', '171/0062', true, NULL, NULL, NULL, NULL, NULL, NULL),
(594, 'VALTER BERNARDELLI', NULL, 'FAZ. N.S APARECIDA', NULL, NULL, NULL, 'MONTE CARMELO', 'MONTE CARMELO', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: AMOCA', NULL, '969.783.688-49', '431/2370', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1288, 'VANDER DE SOUZA ANDRADE', 'VANDER', 'Fazenda Tres Barras', NULL, NULL, NULL, 'Nazareno', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '339.730.676-00', '0011.288.11.0146', true, 2, 2, NULL, NULL, NULL, NULL),
(1360, 'VELOSO AGRIBUSINESS INVEST.  E PART. LTDA', 'VELOSO AGRIBUSINESS INVEST.  E PART. LTDA', 'ROD. BR 354, KM 278 - ZONA RURAL', NULL, NULL, NULL, 'Carmo do Paranaiba', NULL, 'MG', '38840-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '13.013.264/0001-21', NULL, '002050850.01-52', true, 2, 2, NULL, NULL, NULL, NULL),
(1402, 'VELOSO AGRIBUSINESS INVESTIMENTOS E PARTICIPACOES LTDA', 'VELOSO AGRIBUSINESS INVESTIMENTOS E PARTICIPACOES LTDA', 'RODOVIA BR 354, KM 278', NULL, NULL, NULL, 'CARMO DO PARANAIBA', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '13.013.264/0002-02', NULL, '002050850.01-33', false, 2, 7, NULL, NULL, NULL, NULL),
(1364, 'VELOSO AGROPECUARIA EMP. E PART. LTDA', 'VELOSO AGROPECUARIA EMP. E PART. LTDA', 'RODOVIA MG 354 - KM 121 SN', NULL, 'ZONA RURAL', NULL, 'PRESIDENTE OLEGARIO', NULL, 'MG', '38750-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '07.672.228/0002-58', NULL, '0020451830172', true, 2, 2, NULL, NULL, NULL, NULL),
(1414, 'Veloso Café do Cerrado Exportação e Importação LTDA', 'Veloso Café do Cerrado Exportação e Importação LTDA', 'Rodovia BR 354 - Km 278 - Zona Rural', NULL, 'Cep: 38840-000', NULL, 'Carmo do Paranaíba - MG', NULL, NULL, NULL, '+55 34 3851-23', NULL, NULL, NULL, NULL, NULL, NULL, 'CL', 'VE', NULL, 'Paulo Veloso (Diretor Comercial) +55 34 99938 -0940 
email: paulo.veloso@veloso.com.br
Gabriel Veloso (Trader) +55 31 99885-2775 
email: gabriel.veloso@velosoagri.com.br

Caixa Postal 16', '19.449.347/0001-44', NULL, NULL, true, 7, 4, NULL, NULL, NULL, NULL),
(1422, 'Veloso Coffee Agrocomercial Exportadora Ltda.', 'Veloso Coffee Agrocomercial Exportadora Ltda (Pedro Humberto Veloso/Mariana)', 'Rodovia BR 354 KM 288', NULL, 'Zona Rural, Carmo do Paranaíba - MG', NULL, 'CEP: 38.840-000', NULL, NULL, NULL, '+55-34-3851-710', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'Dated.: January 28th, 2016

[09:33:26] Mariana  Lima Veloso: Veloso Agrocomercial Exportadora Ltda
Rodovia BR 354 KM 288 Zona Rural
Carmo do Paranaíba/MG/Brasil
CEP: 38.840-000
CNPJ: 15.709.270/0001-43
Incrição Estadual: 001.978.293.00-83
[09:33:38] Mariana  Lima Veloso: telefone: +55-34-3851-7100
-------------------------------------------------------------------------------------------------

From: Mariana Veloso [mailto:mariana@veloso.com.br] 
Sent: sexta-feira, 29 de julho de 2016 13:01
To: Katia Aragao; Caroline Freitas; Natalia Barletta; Felipe Souza; Verônica Campedelli; Wolthers & Associates; Daniel Wolthers; Rasmus Wolthers; Alan Fiuza
Subject: SOBRE A VELOSO AGROCOMERCIAL EXPORTADORA LTDA

Gostaria de pedir para que os e-mails de todas as transações com a Veloso Agrocomercial Exportadora Ltda, fossem enviados por enquanto apenas para:
mariana@veloso.com.br
pedroh@veloso.com.br = Pedro Humberto Veloso 
pedro@veloso.com.br = Pedro Henrique Lima Veloso
Esta empresa é apenas do Pedro Humberto Veloso, 
somente para esclarecer e para não haver confusão.', '15.709.270/0001-43', NULL, '001.978.293.00-83', true, 7, 4, NULL, NULL, NULL, NULL),
(1529, 'Veloso Green Coffee Exportação LTDA', 'Veloso Green Coffee', 'Av. João Batista da Silva,', '801', NULL, 'Bairro Amazonas', 'Carmo do Paranaíba', NULL, 'MG', '38842-110', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'Razão Social: Veloso Green Coffee Exportação LTDA
CNPJ: 19.449.347/0001-44
NIRE: 312.009.600-54
IE: 1430665380089
Nome Fantasia: Veloso Green Coffee
Endereço:  Av. João Batista da Silva, 801 Bairro Amazonas - Carmo do Paranaíba - MG 
CEP: 38840-000', '19.449.347/0001-44', NULL, '1430665380089', true, 7, 2, NULL, NULL, NULL, NULL),
(1112, 'Veloso Trading New Coffee Comercial Exp. S/A', 'Veloso Trading', 'Av. João Batista da Silva', '801', NULL, 'Amazonas', 'Carmo do Paranaíba', NULL, NULL, '38.840-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'Veloso Trading New Coffee Comercial Exportadora S/A
Av. João Batista da Silva, 701. Bairro Amazonas
Carmo do Paranaíba - MG. CEP: 38.840-000
CNPJ: 10.900.779/0001-55
I.E.: 0012301060063

Veloso Trading New Coffee Comercial Exportadora S/A
CNPJ : 10.900.779/0001-55
 Av João Batista da Silva 801
Bairro : Amazonas
 Carmo do Paranaíba - MG
Telefone (34) 3851-7500

Setor de Logistica :
Rua XV de novembro nr 41 - salas 84/85
Bairro : Centro 
Cidade ; Santos - SP
Telefone (13) 3216-1615', '10.900.779/0001-55', NULL, '0012301060063', true, NULL, 2, NULL, NULL, NULL, NULL),
(282, 'VENERANDO DOGITEL CARVALHO', NULL, 'FAZ. MORRO CAVADO', NULL, NULL, NULL, 'CONCEIÇÃO APARE', 'CONCEIÇÃO APARE', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: ALFENAS CAFÉ', NULL, '519.589.296-20', '171/1351', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1840, 'Vequis Comércio Importação e Exportação LTDA', 'Vequis Comércio Importação e Exportação LTDA', 'Rua Mato Grosso nº 123', NULL, 'Centro, Poços de Caldas/MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'Vequis Comércio Importação e Exportação LTDA
Rua Mato Grosso nº 123
Centro, Poços de Caldas/MG
CEP: 37701006
CNPJ: 11.458.442/0009-50
IE:48369660088', '11.458.442/0009-50', NULL, '48369660088', true, 7, 7, NULL, NULL, NULL, NULL),
(793, 'VERA LUCIA DE ALMEIDA CONCEIÇÃO', 'VERA', 'SITIO SANTO ANTONIO', NULL, 'DISTRITO', 'GRAMINIA', 'ANDRADAS', 'ANDRADAS', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, NULL, NULL, '107.852.588-92', '026/5813', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1558, 'Vera Lúcia de Almeida Conceição', 'Vera Lúcia de Almeida Conceição', 'FAZENDA  SITIO LAGOA', NULL, NULL, NULL, 'NEPOMUCENO', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '107.852.588-92', '001.140.565.00-28', true, 2, 9, NULL, NULL, NULL, NULL),
(969, 'VERIDIANO TAVARES FILHO', 'FAZ.SANTA CARLA', 'FAZ. SANTA CARLA', '1667', NULL, 'CRUZ VERA', 'BRAZOPOLIS', 'BRAZOPOLIS', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, NULL, NULL, '005.124.519-15', '089/1331', true, NULL, NULL, NULL, NULL, NULL, NULL),
(225, 'VIAÇÃO RIODOCE LTDA', NULL, 'DISTRITO DE SANTA LUZIA', NULL, NULL, 'CENTRO', 'CARATINGA', 'CARATINGA', 'MG', '35.300-004', '(33) 3212121', NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CONTATO:', '19.963.701/0004-05', 'IPR: 134/2723', NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(787, 'VICENTE DEON PEREIRA', 'VICENTE', 'SITIO MATO GROSSO', NULL, NULL, NULL, 'RIBEIRAO VERMELHO', 'RIBEIRAO VERMELHO', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'COPACAFE', NULL, '496.648.596-72', '547/0262', true, NULL, NULL, NULL, NULL, NULL, NULL),
(681, 'VICENTE DILELE FILHO', 'VICENTE', 'FAZ. COCAL', NULL, NULL, NULL, 'ESTRELA DO SUL', 'ESTRELA DO SUL', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, NULL, NULL, '162.468.708-30', '248/0623', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1576, 'Vicente Evangelista Salviano', 'Vicente Evangelista Salviano', 'Fazenda Severino Zonal Rural - Palmital', NULL, NULL, NULL, 'Pratinha', NULL, 'MG', '38960-000', NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', 'rvsalviano1@uol.com.br', 'CONTATO: RHAPAEL ( NESPRESSO )', NULL, '222646126-49', '001.372.095.0093', true, 2, 2, NULL, NULL, NULL, NULL),
(1845, 'VICTOR NAKAO SASAKI', 'VICTOR NAKAO SASAKI', 'Fazenda Catanduva II', NULL, NULL, NULL, 'Patos de Minas', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', 'E-MAIL: marie3mc@hotmail.com / mm.nakao@outlook.com', NULL, NULL, '104.919.986-35', '004.759.3850048', true, 2, 2, NULL, NULL, NULL, NULL),
(1320, 'VILSON SOUZA', 'VILSON SOUZA', 'Av. Dr. Getulio Portela', '284', 'sala 04', NULL, 'Campos Altos', NULL, 'MG', '38970-000', NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, NULL, NULL, true, 2, 2, NULL, NULL, NULL, NULL),
(1485, 'VIRGINIA COUTINHO AGUIAR', 'VIRGINIA COUTINHO AGUIAR', 'Fazenda Semente', NULL, NULL, NULL, 'Patrocinio', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, 'VANDUIR', NULL, '753.845.906-53', '001254313-0098', true, 2, 2, NULL, NULL, NULL, NULL),
(171, 'VIRGOLINO ADRIANO MUNIZ', NULL, 'FAZENDAS DAS ALMAS', NULL, NULL, NULL, 'CABO VERDE', 'CABO VERDE', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: NEWTON VAZ', NULL, '214308456-00', '095/1227', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1760, 'VITOR MARCELO QUEIROZ BARBOSA', 'VITOR MARCELO QUEIROZ BARBOSA', 'Faz. Chapadao', NULL, NULL, NULL, 'Carmo do Paranaiba', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '043.520.716-41', '0012094820653', true, 2, 2, NULL, NULL, NULL, NULL),
(1176, 'WAGNER JOSÉ DA COSTA', 'WAGNER', 'Faz. Primavera', NULL, NULL, NULL, 'Alfenas', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', 'IPANEMA', NULL, NULL, '441.054.446-20', '001141272.00-44', true, 2, 2, NULL, NULL, NULL, NULL),
(621, 'WALDEMAR BOVI', 'WALDEMAR BOVI', 'FAZ. DONA IDALVA', NULL, NULL, NULL, 'ROMARIA', 'ROMARIA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'AMOCA', NULL, '126.486.989-49', '564/0567', true, NULL, NULL, NULL, NULL, NULL, NULL),
(461, 'WALDEMAR BOVI', 'WALDEMAR BOVI', 'FAZ. PARANAVAÍ', NULL, NULL, NULL, 'MONTE CARMELO', 'MONTE CARMELO', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: AMOCA', NULL, '126.486.989-49', '431/0615', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1543, 'WALTER LÚCIO BORGES', 'WALTER LÚCIO BORGES', 'Fazenda da Serra', NULL, NULL, NULL, 'Araxá', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', NULL, 'VE', NULL, 'ACAUA', NULL, '303.021.296-34', '001445311-0030', true, 2, 2, NULL, NULL, NULL, NULL),
(684, 'WALTER RODRIGUES DE FREITAS FILHO E OUTROS', 'WALTER', 'FAZ. PAULISTA', NULL, NULL, NULL, 'MONTE CARMELO', 'MONTE CARMELO', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'AMOCA', NULL, '553.815.966-34', '431/2751', true, NULL, NULL, NULL, NULL, NULL, NULL),
(688, 'WANDO JOSE DO AMARAL E OUTROS', 'WANDO', 'FAZ. SERRA NEGRA - CORREGO FEIO', NULL, NULL, NULL, 'PATROCINIO', 'PATROCINIO', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, NULL, NULL, '766.003.356-53', '481/4822', true, NULL, NULL, NULL, NULL, NULL, NULL),
(746, 'WASHINGTON NEY BARBOSA', 'WAS', 'FAZ. BARBOSA -', NULL, 'ZONA RURAL', 'CORREGO DA CACHOEIRA', 'CARATINGA', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, NULL, NULL, '218.339.826-49', '0011988770025', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1694, 'WILIAN RIBEIRO DOS SANTOS', 'WILIAN RIBEIRO DOS SANTOS', 'Faz. Mutuca e Campestre', NULL, NULL, NULL, 'Campos Altos', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'RE', 'VE', NULL, 'NILSON', NULL, '101.448.926-18', '003.617.046-0059', true, 2, 2, NULL, NULL, NULL, NULL),
(427, 'WILSON ANTONIO DA SILVA', NULL, 'FAZ. MATA DO SALGADO', NULL, NULL, NULL, 'CARMO DO PARANA', 'CARMO DO PARANA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: ISMAEL', NULL, '366.102.836-72', '143/3378', true, NULL, NULL, NULL, NULL, NULL, NULL),
(510, 'Wolthers Serviços Empresarias Eireli - ME', 'Wolthers Serviços Empresarias Eireli - ME', 'Rua Republica do Peru', '03', 'apto 21', NULL, NULL, NULL, 'SP', '11030-290', NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, '19.807.670/0001-42', '2588067', NULL, true, NULL, 2, NULL, NULL, NULL, NULL);
