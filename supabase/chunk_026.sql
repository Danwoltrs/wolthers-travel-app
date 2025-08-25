-- Bulk import of all remaining legacy clients
INSERT INTO public.legacy_clients (
    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
    logo, logo_altura, logo_largura, auto_size
) VALUES
(1344, 'ESTRELA COMERCIO E EXP. DE CAFE LTDA-ME', 'ESTRELA COMERCIO E EXP. DE CAFE LTDA-ME', 'Rua Américo Ferreira de Sá', '73', 'Sao Sebastiao da Estrela', NULL, 'Santo Antonio do Amparo', NULL, 'MG', '37.262-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '17.110.692/0001-23', NULL, '002.052.976-0061', false, 2, 7, NULL, NULL, NULL, NULL),
(1370, 'Estrela Comércio e Exportadora de Café Ltda-ME', 'Estrela Comércio e Exportadora de Café.', 'Rua Rivalino Antonio de Barros, 22 A', NULL, NULL, 'São Sebastião da Estrela,', 'Sto. Antônio do Amparo', NULL, 'MG', '37262-000', '(35) 38638178 /', '35 - 3863-2160', NULL, '(35) 98029032', NULL, 'estrela12@live.com', 'J', 'CL', 'VE', 'contato: Tiago Barbosa
ID: RA_00025552108', 'CÓDIGO EXPORTADOR: 1572

Estrela Comércio e Exportadora de Café Ltda-ME
Rua Rivalino Antonio de Barros, 22 A
São Sebastião da Estrela, Sto. Antônio do Amparo/MG
Postal code: 37262-000
phone: +55 (35) 38638178

SANTANDER: 
Correspondent Bank: Standard Chartered Bank - New York - USA 
Swift (BIC CODE): SCBLUS33XXX 
Clearing Code: ABA 026002561 / CHIPS UID 0256 
Account Number: 3544034644001 
Beneficiary Bank: Banco Santander (Brasil) S.A. 
                             Lavras - MG 
Swift (BIC CODE): BSCHBRSP 
Account NR: 13002082-5 
IBAN:?BR02 9040 0888 0318 3013 0020 825C 1 

BRASIL: 
CORRESPONDENT BANK: BANCO DO BRASIL - NY 
SWIFT: BRASUS33 
ACCOUNT NR: 81050011-5 
ABA: 026003557 
NEW YORK - U.S.A 
 
BENEFICIARY BANK: BANCO DO BRASIL S/A. (MT 103) (ESTRELA) 
SANTO ANTONIO DO AMPARO - MG - BRAZIL 
SWIFT: BRASBRRJBHE 
IBAN CODE: BR4000000000026010000133213C1 
ACCOUNT NR: 13321-3 

ITAÚ: 
Account with: JPMorgan Chase Bank, N.A 
Swift Code: CHASUS33 
Account nr: 544705690 
In favor of Itaú Unibanco S.A. 
Swift code: ITAUBRSP 
Código IBAN: BR23 6070 1190 0080 2000 0204 644C 1 
Account nr: 20464-4', '17.110.692/0001-23', NULL, '002.052.976-0061', true, 7, 7, NULL, NULL, NULL, NULL),
(1715, 'EUDES MARTINS DA SILVA', 'EUDES MARTINS DA SILVA', 'Faz. Nsra Aparecida  e Sta Maria', NULL, NULL, NULL, 'Campos Altos', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, 'nilson', NULL, '399.499.236-20', '003.876.259-0006', true, 2, 2, NULL, NULL, NULL, NULL),
(219, 'EURICO WATANABE', 'EURICO WATANABE', 'FAZ. DIAMANTE', NULL, NULL, NULL, 'RIO PARANAÍBA', 'RIO PARANAÍBA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: AMOCA', NULL, '413.202.479-20', '555/2641', true, NULL, NULL, NULL, NULL, NULL, NULL),
(289, 'EURICO WATANABE E OUTROS', NULL, 'FAZ. N.S. DA APARECIDA', NULL, NULL, NULL, 'MONTE CARMELO', 'MONTE CARMELO', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: AMOCA', NULL, '413.202.479-20', '431/1291', true, NULL, NULL, NULL, NULL, NULL, NULL),
(927, 'EVERALDO GONÇALVES SIQUEIRA', 'EVERALDO', 'FAZ. SANTA CECÍLIA', NULL, NULL, NULL, 'CARMO DO PARANAÍBA', 'CARMO DO PARANAÍBA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'COOCACER - ZE REINALDO', NULL, '460.767.356-00', '143/1531', true, NULL, NULL, NULL, NULL, NULL, NULL),
(54, 'Exportadora de Café Guaxupé Ltda.', 'Exportadora de Café Guaxupé Ltda', 'Rua José Augusto Ribeiro do Valle, 1159', 'Angola -37.800-000', NULL, 'Guaxupé, Minas Gerais - Brazil', NULL, NULL, NULL, NULL, '(035)3559-5905', NULL, NULL, NULL, 'guaxupe.export@guaxupe.com.br', 'guaxupe.export@guaxupe.com.br', 'J', 'CL', 'VE', NULL, NULL, '20.775.003/0001-04', NULL, '287.048.849.0081', true, NULL, 7, NULL, NULL, NULL, NULL),
(841, 'EXPORTADORA DE CAFÉ TRIANGULO MINEIRO LTDA', 'TRIANGULO', 'AV. FARIA PEREIRA', '1252', 'SALA 01', NULL, 'PATROCINIO', 'PATROCINIO', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'ACAIA


CNPJ DA C/C: 82.687.591/0001-81', '82.687.591/0002-62', NULL, '001.0264.5200/25', true, NULL, NULL, NULL, NULL, NULL, NULL),
(981, 'EXPORTADORA DE CAFÉS CARMO DE MINAS LTDA', 'Carmo Coffees', 'Rua Capitao Francisco Isidoro', '181', '37472-000', NULL, 'Carmo de Minas', NULL, NULL, NULL, '35 34221288', NULL, NULL, NULL, NULL, 'jacques@carmocoffees.com.br', 'J', 'CL', 'VE', NULL, 'Contact.: Jacques Carneiro

Rua Francisco Sales, 65 sala 01
Centro - Pouso Alegre, MG
Cep.: 37550-000', '09.243.971/0001-37', NULL, '001.054.835-0035', true, NULL, 2, NULL, NULL, NULL, NULL),
(1373, 'Exportadora de Cafés Carmo de Minas Ltda.', 'Exportadora de Cafés Carmo de Minas Ltda.', 'Rod. BR 460, nº 2.250 - B', NULL, 'Palmela, Carmo de Minas - MG', NULL, 'CEP: 37.472-000', NULL, NULL, NULL, '35 3334 2240', NULL, NULL, NULL, 'financeiro@carmocoffees.com.br', NULL, 'J', 'CL', 'VE', 'Contact.: Jacques Carneiro - jacques@carmocoffees.com.br
               Natália Araújo - natalia@carmocoffees.com.br', 'Novo endereço 15/09/2021:

EXPORTADORA DE CAFES CARMO DE MINAS LTDA
Rod. BR 460, 2.250 - B Palmela
Carmo de Minas, MG, 37472-000 Brazil
Phone : +55 35 3331 5707

Matriz:	Nota fiscal 
Exportadora de Cafés Carmo de Minas Ltda
CNPJ: 09.243.971/0001-37
IE: 001.054.835.00-35
Endereço: Rodovia BR 460, Nº 2.250-Palmela
CEP: 37.472-000	

Intermediary Bank: Standard Chartered Bank / New York / USA
Swift Code: SCBLUS33 - ABA: 026002561
Beneficiary Bank: Banco Itaú BBA S/A - Sao Paulo / SP / Brazil
Swift Code: ITAUBRSPNHO - ACCOUNT: 3544-030205-001
For futher credit to: EXPORTADORA DE CAFES CARMO DE MINAS LTDA
IBAN : BR03 6070 1190 0159 7000 0259 306C 1 


Endereço antigo: Exportadora de Cafés Carmo de Minas Ltda.
                            Rua Cap Francisco Isidoro, nº 181
                            Centro, Carmo de Minas - MG
                            CEP: 37.472-000, Brasil
                            Phone : +55 35 3334 2240', '09.243.971/0001-37', NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1512, 'Exportadora de Cafés Patrocínio Eireli - ME', 'Exportadora de Cafés Patrocínio', 'Av. Jacinto Barbosa, 597', NULL, NULL, NULL, 'São Francisco, Patrocínio/MG', NULL, NULL, NULL, '(34) 99841410', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'Exportadora de Cafés Patrocínio Eireli - ME
Av. Jacinto Barbosa, 597 sala 03
São Francisco, Patrocínio/MG
CEP.: 38.742-038


Dados bancários:

Banco Santander do Brasil SA.
Agência 3610 
C/C 13 001740-6
IBAN code
BR58 9040 0888 0361 0013 0017 406C 1', '27.488.481/0001-82', NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(995, 'Exportadora Poços de Caldas LTDA', NULL, 'Rua Piauí 129 - Centro', NULL, NULL, NULL, NULL, NULL, 'MG', '37701-024', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '04.935.791/0001-00', NULL, '518.169.029.0018', true, NULL, NULL, NULL, NULL, NULL, NULL),
(640, 'EZIO GUIMARAES RIBEIRO E OUTRO', NULL, 'FAZ. SERRADAO', NULL, NULL, NULL, 'GUIMARANIA', 'GUIMARANIA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'ACAIA', NULL, '851.087.406-97', '289/0691', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1779, 'F.M CORRETAGEM DE MERCADORIAS LTDA', 'F.M CORRETAGEM DE MERCADORIAS LTDA', NULL, NULL, NULL, NULL, 'SANTOS', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'VITOR FAULIM', NULL, NULL, NULL, true, 2, 2, NULL, NULL, NULL, NULL),
(1745, 'FABIO ARAUJO LEITE', 'FABIO ARAUJO LEITE', 'Faz. Mantibio', NULL, NULL, NULL, 'Medeiros', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, 'NILSON', NULL, '623.701.896-49', '001.216.771-0216', true, 2, 2, NULL, NULL, NULL, NULL),
(855, 'FÁBIO SOARES DE SOUZA E OUTROS', 'FÁBIO', 'FAZ. SANTA JÚLIA', NULL, NULL, NULL, 'PIUMHI', 'PIUMHI', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, NULL, NULL, '510.707.316-68', '515/2536', true, NULL, NULL, NULL, NULL, NULL, NULL),
(649, 'FACI -FED.ASSOC.COMUNIT.DE AGRI.FAM.IUNA E IRUPI', 'FACI', 'AV.DESEMBARGADOR EPAMINONDAS DO AMARAL', '113', NULL, 'CENTRO', 'IUNA', 'IUNA', 'ES', '29390-000', '028-35451249', NULL, '28-35452343', '28-99392097', NULL, NULL, 'J', 'VE', 'VE', NULL, NULL, '00.459.844/0001-03', NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(632, 'FACI-FED.DE ASS.COM.DE AGRIC.FAM. DE IUNA E IRUPI', 'FACI', 'RUA DESEMBARGADOR EPAMINONDAS DO AMARAL', '113', NULL, 'CENTRO', 'IUNA', 'IUNA', 'ES', '29390-000', '28-3545-1249', NULL, '28-35452343', NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1357, 'FAL HOLDINGS PARTICIPAÇÕES LTDA', 'FAL HOLDING', 'Fazenda Santa Izabel', 'S/N', NULL, NULL, 'Ouro Fino', NULL, 'MG', '37570-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '17.073.570/0001-04', NULL, '002.226.979-0014', true, 2, 2, NULL, NULL, NULL, NULL),
(1803, 'Farmers Direct Coffee', 'Farmers Direct Coffee', 'Snekerweg 3, room 24', NULL, '8701 PZ Bolsward - Netherlands', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'VE', 'Daisy de Groot <d.degroot@farmersdirect.coffee>
Tim van Amerongen <t.vanamerongen@farmersdirect.coffee>
Ward de Groote <w.degroote@farmersdirect.coffee>', 'Farmers Direct Coffee
Snekerweg 3, room 24
8701 PZ Bolsward
Netherlands', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1506, 'Farroupilha Trading Importação e Exportação LTDA.', 'Farroupilha Trading', 'Avenida Duartina Maria de Jesus, 1357', NULL, 'Distrito Industrial III,', NULL, 'Patos de Minas - MG', NULL, NULL, '38700-971', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'Iancio Carlos Urban
End. Fazenda Rio Brilhante Café
Coromandel - MG
Zona Rural

CPF 194.096.130.00
Cep 38.550-000', NULL, NULL, '001.112.255.04.64', true, 7, 4, NULL, NULL, NULL, NULL),
(123, 'FATEC S/A', 'FATEC S/A', 'PRACA DA LIBERDADE', '130', '10° ANDAR', 'LIBERIDADE', 'SAO PAULO', 'SAO PAULO', 'SP', '01.503-010', '(11) 6054521', NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CONTATO: SHIMANO', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(676, 'FAUSTO DO ESPIRITO SANTO VELOSO', 'FAUSTO', 'FAZ. MATINHA', NULL, NULL, NULL, 'CARMO DO PARANAIBA', 'CARMO DO PARANAIBA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'ASSOCAFE', NULL, '124.691.906-06', '143/1159', true, NULL, NULL, NULL, NULL, NULL, NULL),
(330, 'FAUSTO DO ESPIRITO SANTO VELOSO', NULL, 'FAZ. SÃO LUIZ', NULL, NULL, NULL, 'CARMO DO PARANA', 'CARMO DO PARANA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: MVR', NULL, '124.691.906-06', '143/2474', true, NULL, NULL, NULL, NULL, NULL, NULL),
(447, 'FAUSTO DO ESPIRITO SANTO VELOSO', NULL, 'FAZ. SANTA CECILIA', NULL, NULL, NULL, 'CARMO DO PARANA', 'CARMO DO PARANA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: AGROP. MVR', NULL, '124.691.906-06', '143/2473', true, NULL, NULL, NULL, NULL, NULL, NULL),
(966, 'FAZ. ALIANÇA  LTDA', 'FAZ. ALIANÇA', 'AGUAS  DA PRATA KM 2', NULL, NULL, 'S.J. BOA VISTA', NULL, NULL, 'SP', '13870-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, NULL, '01.983.812/0001-67', NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1545, 'FAZENDA ASAHI LTDA', 'FAZENDA ASAHI', 'Rod. BR 262 KM 720', NULL, NULL, NULL, 'Araxa', NULL, 'MG', '38.180-555', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, NULL, '21.350.592/0001-41', NULL, '002405950001', true, 2, 2, NULL, NULL, NULL, NULL),
(884, 'Fazenda Império', 'Fazenda Império', 'Rod. BR 365 Km 254', 'S/N', NULL, NULL, 'Buritizeiro', 'Brazil', 'MG', '39280-000', '(34) 3821 5306', '34 3821-6063', NULL, NULL, NULL, 'fazenda@fazendaimperio.com.br', 'J', 'CO', 'VE', 'CPF: 213.458.726.15 (PAULO HENRIQUE DE FARIA)
I.E Produtor Rural. 001163173.00-70', 'Contato (2016): Marília Faria

Endereço p/ Correspondencia:
A/C Paulo Henrique Faria
Rua Tiradentes, 430 apt 401
Centro - Patos de Minas - MG
Cep: 38700-134

amostra: marilia@fazendaimperio.com.br
logística: fazenda@fazendaimperio.com.br
trading: fazenda@fazendaimperio.com.br;
marilia@fazendaimperio.com.br

Flavia Faria', NULL, '213.458.726.15', '094/0986', true, NULL, 7, NULL, NULL, NULL, NULL),
(862, 'FAZENDA MACAUBAS', 'MACAUBAS', NULL, NULL, NULL, NULL, NULL, NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(877, 'FAZENDA OURO VERDE', 'PIRAJU', NULL, NULL, NULL, NULL, NULL, NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(863, 'Fazenda Pântano - Versi Crivelenti Ferrero e Outro', 'PANTANO', 'Rua Tiradentes, 78', NULL, NULL, NULL, NULL, NULL, NULL, '14.350-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'Versi Criventi Ferrero

Endereço do escritório:

Rua Presidente Vargas, 1276
Patrocínio - MG.




Versi Crivelenti Ferrero e Outros
FAzenda Pântano
Patos de Minas /MG CEP 38.700-000
CPF: 046.422.078-56
PR: 480/4070

Endereço para correspondencia: Rua MAjor Garcia, 928 CEP: 14.350-000 Altinópolis/SP.', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1113, 'Fazenda Progresso Ltda', 'Fazenda Progresso II', 'Rod. BA 142 - KM 123', NULL, 'Zona Rural', NULL, 'Mucugê', 'Brasil', 'BA', '46750-000', '77 3413-5080', '77 3413-5070', NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'CONTACT: Mr. Fernando N. Oliveira', '09482129/0001-58', NULL, NULL, true, NULL, 7, NULL, NULL, NULL, NULL),
(124, 'FAZENDA RIO VERDE', NULL, 'ROD. CIRCUITO DAS AGUAS', 'KM 321', 'CX. POSTAL 05', NULL, 'CONCEICAO DO RI', 'CONCEICAO DO RI', 'MG', '37.430-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CONTATO:', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(208, 'FAZENDA SEQUOIA LTDA', NULL, 'EST. CAPELINHA/NOVO CRUZEIRO', NULL, NULL, NULL, 'CAPELINHA', 'CAPELINHA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CONTATO: RICARDO ZIKAN', '21.882.915/0001-48', 'IPR: 123/0368', NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(125, 'FAZENDA SERTAOZINHO LTDA', NULL, 'AV. MAJOR ANT. ALBETTO FERNANDES', '312', NULL, 'CENTRO', 'BOTELHOS', 'BOTELHOS', 'MG', '37.720-000', '(35) 7412030', NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CONTATO:', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1404, 'Fazendas Klem Ltda', 'Fazendas Klem Ltda', 'Rua São Francisco de Assis, 32', NULL, 'Centro, Luisburgo - MG', NULL, NULL, NULL, NULL, '36923-000', '55 33 3378-7022', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'VE', 'www.fazendasklem.com.br', 'CECAFE/OIC: 1566', '21 610 272 0001 83', NULL, '002 485 545 0065', true, 7, 4, NULL, NULL, NULL, NULL),
(807, 'FAZENDAS NOSSA SENHORA DA GUIA S.A', 'SENHORA', 'BOA VISTA ENTRADA LAGOA DOS PATOS', 'S/N', NULL, NULL, 'PIMENTA', 'PIMENTA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'ZE GERALDO', '01.056.140/0002.25', NULL, '505.960.605.0129', true, NULL, NULL, NULL, NULL, NULL, NULL),
(110, 'FAZENDAS RIODOCE LTDA', NULL, 'DISTRITO DE SANTA LUZIA', NULL, NULL, NULL, 'CARATINGA', 'CARATINGA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'VE', 'VE', NULL, 'CONTATO: SAUL', '19.963.701/0004-05', 'IPR: 134/2723', NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1203, 'Fedecocagua, R.L.', 'Fedecocagua', '29 Av. 31-59, Zona 5', NULL, NULL, 'Guatemala -', NULL, '01005', NULL, NULL, '(502) 23355740', NULL, '(502) 23356064', NULL, NULL, NULL, 'J', 'CL', 'VE', NULL, 'Gerardo Alberto De León
Marketing Manager
FEDECOCAGUA, R.L.
29 Av. 31-59, Zona 5
Guatemala, 01005
Tel. (502) 23355740/23355790
Fax (502) 23356094
Web. www.fedecocagua.com.gt', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(231, 'FELIX MIYOSHI SHIMOKOMAKI', NULL, 'FAZENDA SANTA BÁRBARA', NULL, NULL, NULL, 'MONTE CARMELO', 'MONTE CARMELO', 'MG', NULL, '(34) 8424590', NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'CONTATO: AMOCA', NULL, '369.077.319-91', '431/1591', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1557, 'Fernando C. Franceschilli', 'Fernando C. Franceschilli', 'FAZENDA  ALTO ALEGRE', NULL, NULL, NULL, 'JACUTINGA', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '312.242.718-40', '002.112.549.00-98', true, 2, 9, NULL, NULL, NULL, NULL),
(1265, 'FERNANDO CESAR MARTINS E OUTROS', 'FERNANDO', 'Faz. Sao Tiago', NULL, NULL, NULL, 'Pres. Olegario', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '308.782.339-20', '0013396840020', true, 2, 2, NULL, NULL, NULL, NULL),
(1224, 'FERNANDO DE OLIVEIRA SARRETA', 'FERNANDO DE OLIVEIRA SARRETA', 'Sitio Ouro Verde', NULL, NULL, NULL, 'Jeriquara', NULL, 'SP', NULL, NULL, NULL, NULL, '16-9197-0399', NULL, NULL, 'J', 'RE', 'VE', 'CPF: 284.605.178-02', NULL, '08.162.436/0002-70', NULL, '402053249111', true, 2, 2, NULL, NULL, NULL, NULL),
(923, 'FERNANDO DE SOUZA MOREIRA', 'SOUZA', 'FAZ. OLHOS D''AGUA', NULL, NULL, NULL, 'RIO PARANAIBA', 'RIO PARANAIBA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'COOCACER - ZE REINALDO', NULL, '043.076.216-03', '555/4077', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1316, 'FERNANDO MARTINS FERREIRA E OUTROS', 'FERNANDO MARTINS FERREIRA E OUTROS', 'Fazenda Chapadão', NULL, NULL, NULL, 'Candeiais', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '047.644.646-59', '001341973-0055', true, 2, 2, NULL, NULL, NULL, NULL),
(1487, 'FERNANDO NOGUES BELONI E OUTROS', 'FERNANDO NOGUES', 'Fazenda Horizontina', NULL, NULL, NULL, 'Patrocinio', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, NULL, NULL, '124.917.278-03', '001.359.763.02-51', true, 2, 2, NULL, NULL, NULL, NULL),
(1690, 'FERNANDO NUNES OLIVEIRA', 'FERNANDO NUNES OLIVEIRA', 'Faz. Gurita', NULL, NULL, NULL, 'Medeiros', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, 'NILSON', NULL, '091.637.836-57', '002.357.024-0070', true, 2, 2, NULL, NULL, NULL, NULL),
(1656, 'FERNANDO OLIVEIRA CASTRO', 'FERNANDO OLIVEIRA CASTRO', 'Fazenda Puxa Puxa III', NULL, NULL, NULL, 'Perdizes', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', 'VE', NULL, 'ACAUA', NULL, '071.420.418-89', '0014400871-0070', true, 2, 2, NULL, NULL, NULL, NULL),
(836, 'FERNANDO TOSTES FERRAZ', 'FERRAZ', NULL, NULL, NULL, NULL, 'CARMO DE MINAS', 'CARMO DE MINAS', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(668, 'FERNANDO VIEIRA VINHAL', 'FERNANDO', 'FAZ. BRAVINHOS/FONSECAS', NULL, NULL, NULL, 'CARMO DO PARANAIBA', 'CARMO DO PARANAIBA', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'VE', 'VE', NULL, 'ASSOCAFE', NULL, '999.819.206-49', '143/3174', false, NULL, 2, NULL, NULL, NULL, NULL);
