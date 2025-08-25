-- Bulk import of all remaining legacy clients
INSERT INTO public.legacy_clients (
    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
    logo, logo_altura, logo_largura, auto_size
) VALUES
(700, 'UNICAFE-CIA. DE COMERCIO EXTERIOR', 'UNICAFE', 'ROD. MG 111 KM 104,6', NULL, NULL, 'ZONA RURAL', 'MANHUMIRIM', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '28.154.680/0014-31', NULL, '395.100.333-0318', true, NULL, 2, NULL, NULL, NULL, NULL),
(1188, 'UNION TRADING COM. EXP. E IMP. LTDA', 'Union Trading', 'Rua do Comercio do Café', '101-A', NULL, NULL, 'Varginha', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', 'dsquilace@utrading.com.br - Diego', '17/01/2025
A Union passou os emails abaixo para contato:

lhenrique@utrading.com.br
traffic@utrading.com.br
traffic2@utrading.com.br
qualidade@utrading.com.br', '11.881.236/0003-62', NULL, '1734641-0033', true, 7, 7, NULL, NULL, NULL, NULL),
(35, 'V0LCAFE LTDA', 'V0LCAFE LTDA', 'AV. DR. AMADOR DE BARROS', '1446', NULL, NULL, 'BATATAIS', 'BATATAIS', 'SP', '14.300-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO:', '61.100.772/0004-32', NULL, '208.029.134.119', true, NULL, NULL, NULL, NULL, NULL, NULL),
(513, 'VALORIZAÇÃO EMPRESA DE CAFÉ S/A', NULL, NULL, NULL, NULL, NULL, 'RIO DE JANEIRO', 'RIO DE JANEIRO', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(90, 'Veloso Trading New Coffee Comercial Exportadora S/A', 'VELOSO', 'AV. JOAO BATISTA DA SILVA', '701', NULL, NULL, 'CARMO DO PARANAIBA', NULL, 'MG', '38.840-000', '(34) 8512000', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'CONTATO: JUNIOR

Veloso Trading New Coffee Comercial Exportadora S/A
Av. João Batista da Silva, 701. Bairro Amazonas
Carmo do Paranaíba - MG. CEP: 38.840-000
CNPJ: 10.900.779/0001-55
I.E.: 0012301060063', '10.900.779/0001-55', NULL, '143.185.973-0035', true, NULL, 2, NULL, NULL, NULL, NULL),
(827, 'VILA LATINA IMPORTADORA E EXPORTADORA LTDA', 'VILA LATINA', NULL, NULL, NULL, NULL, NULL, NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'BEIGEL', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(339, 'VOLCAFE LTDA', 'VOLCAFE LTDA', 'AV. DR. JAMBEIRO COSTA', '2500', 'PRÉDIO A SALA 3', 'SERELEPE', 'LEME', NULL, 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'CONTATO:', '61.100.772/003-51', NULL, '415.057.345.117', true, NULL, 2, NULL, NULL, NULL, NULL),
(537, 'VOLCAFE LTDA', 'VOLCAFE LTDA', 'ESTRADA DOS PIONEIROS', '950', NULL, NULL, 'LONDRINA', NULL, 'PR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '61.100.772/0005-13', NULL, '90254128-40', true, NULL, 2, NULL, NULL, NULL, NULL),
(1136, 'VOLCAFE LTDA', 'VOLCAFE', 'Av. Pres. Tancredo Neves', '1474-A', NULL, 'Zacaria', 'Caratinga', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, '61.100.772/0007-85', NULL, '707.602.90.0110', true, 2, 2, NULL, NULL, NULL, NULL),
(1369, 'Volcafe U.S.A LLC.', 'Volcafe USA', '80, Cottontail Lane', NULL, NULL, 'Somerset, NJ 08873 - U.S.A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(815, 'W & S COMÉRCIO IMPORTAÇÃO E EXORTAÇÃO LTDA', 'W & S', 'RUA XV DE NOVEMBRO', '96', NULL, 'CENTRO', 'SANTOS', NULL, 'SP', '11010-150', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'W&S Comercio, Importação e Exportação LTDA
CNPJ 64.085.772/0001-56

Banco Bradesco - 
Ag 2200 - 
C/C 025233-6

PIX 64.085.772/0001-56', '64.085.772/0001-56', NULL, '633.276.455-112', true, NULL, 2, NULL, NULL, NULL, NULL),
(509, 'WAGNER AVELINO BOERI FERRARI', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1796, 'Westfeldt Brothers Inc.', 'Westfeldt Brothers Inc.', 'PO Box 51750', NULL, NULL, NULL, 'New Orleans, LA', 'USA', NULL, '70151', '(USA) 504 / 586', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, NULL, NULL, NULL, NULL, true, 21, 21, NULL, NULL, NULL, NULL),
(2, 'Wolthers & Associates Corretora de Mercadorias LTDA.', 'WOLTHERS', 'Rua Quinze de Novembro,', '94/96', '3rd floor', 'Centro', 'Santos', 'Brazil', 'SP', '11010-150', '2127-4144', NULL, '2127-4144', NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, 'FEDEX :177535826 
TNT: 536
DHL: 654259058
DHL CONTA INTERNACIONAL: 965841799
UPS: A3099T

Wolthers & Associates Corretora de Mercadorias LTDA.
Rua Quinze de Novembro, 94/96 - 3º andar
Bairro: Centro, Santos/SP
CEP.: 11010-150
CNPJ 62.298.906/0001-91

BANCO BRADESCO
AG: 0045-0
C/C: 219511-9', '62.298.906/0001-91', '096.946-8', 'ISENTA', true, NULL, 2, NULL, NULL, NULL, NULL),
(942, 'WOLTHERS ENTERTAINMENT LTDA', 'BIKKINI', 'RUA QUINZE DE NOVEMBRO', '94/96', NULL, NULL, 'SANTOS', 'SANTOS', 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, '10.573.858/0001-07', NULL, '633.679.522.115', true, NULL, NULL, NULL, NULL, NULL, NULL),
(1193, 'Woongjin Foods Co., Ltd.', 'Woongjin Foods', '11F, Kukdong Bldg, Chungmuro 3-ga,', '100-705', 'Jung-gu', NULL, 'Seoul', 'South Korea', NULL, NULL, '82) 2-3668-9291', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CO', NULL, 'Contact:
Mr. Sangweon HA', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(507, 'ZE GERALDO - MINAS COM. DE CAFÉ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CO', 'CO', NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL),
(1393, 'Zephyr Green Coffee LLC', 'Zephyr Coffee Merchants', '40 Danbury Road', NULL, NULL, 'Wilton, CT 06897 - USA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'CO', NULL, 'New address:
De: Tom Sullivan <tom@wolthers.com> 
Enviada em: terça-feira, 20 de outubro de 2020 10:00

Zephyr Green Coffee LLC
40 Danbury Road
Wilton, CT 06897 - USA


PSS 
ZEPHYR GREEN COFFEE LLC. 
642 JULIA STREET
NEW ORLEANS, LOUISIANA
Zip Code:	70130
UNITED STATES
ANDERSON STOCKDALE
504-569-1595 FAX: 504-569-1598
TAX / VTA/ RUC Number	20-5891458

Bank Remittance
CITIBANK N.A., C/O IT''S SERVICER, 
CITICORP NORTH AMERICA, INC. 
SORT-3000 
ATTN: Export Collections Dept. 
3800 CITIBANK CENTER, BUILDING B, 1st FLOOR 
TAMPA, FL 33610 
SWIFT: CITIUS33', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1084, 'Zoegas Kaffee', 'Nestlé Sverige AB', 'Nestlé Sverige AB', 'SE-254 53', 'Grenadjärsgatan 6', NULL, 'Helsingborg', NULL, NULL, NULL, '00 46 42 126200', NULL, NULL, NULL, NULL, '������\n\u0000��V���]\u001fP��T�\u0006�ky\u00167��^������A�k�g�wž)�̺��}u�i�����myd�0p=\u0004��\u0005x��uy��Q��\u0012�N�\u0005\t��O\t�\f\u000f¾���t\u0015о\u001bAp�.5V7�3q��GϦ�\u001b�\u0004i����T~\u0006Ӣ���9���-\fo�aN�c\u000f�\u0000w9�5�~\u0017]kƲ�~$�N�{�iZ\u0015���\f�\u001f*i��\u001c\"1�\u0000H���\u0000?{5����Sx�ź��39K�O���\u0000', 'J', 'CL', 'CO', NULL, 'ZOEGAS KAFFEE AB
ZOEGAS
DOUGLAS JONHAG

Pls note that as from April 7th our new address for courir deliveries is: 
Zoegas Kaffee
Nestlé Sverige AB
Zoégas Purchasing
Grenadjärsgatan 6
SE-254 53 Helsingborg



Message below received on Nov. 20th
---------------------------------------------------
Please note that as from 2012.11.15 our bank details are as follows:
Danske Bank
12400108641
IBAN: SE6512000000012400108641
SWIFT: DATABASESX

Collection Address:
Danske Bank Sverige Filial
Trade and Export Finance
Östra Hamngatan 13
404 22 Göteborg
Tel: +46(0)752484174
------------------------------------------------------------', NULL, NULL, NULL, true, NULL, 12, '����\u0000\u0010JFIF\u0000\u0001\u0001\u0001\u00010\u00010\u0000\u0000��\u0000C\u0000\u0006\u0004\u0005\u0006\u0005\u0004\u0006\u0006\u0005\u0006\u0007\u0007\u0006\b\n\u0010\n\n\t\t\n\u0014\u000e\u000f\f\u0010\u0017\u0014\u0018\u0018\u0017\u0014\u0016\u0016\u001a\u001d%\u001f\u001a\u001b#\u001c\u0016\u0016', NULL, NULL, false),
(1147, '-COOPERATIVA DE PRODUTORES E EXPORTADORES DE CAFE DO CERRADO MINEIRO LTDA', 'COODEPEC', 'RUA  CESARIO  ALVIM', '655', NULL, 'CENTRO', 'PATROCINIO', 'BRASIL', 'MG', '38740-000', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '12.061.112/0001-31', NULL, '00161085400-10', true, 9, 9, NULL, NULL, NULL, NULL),
(1554, '(Cadefihuila) Cooperativa Departamental de Caficultores del Huila', 'Cadefihuila', 'Calle 4 No. 3-37', NULL, 'Neiva (Huila)', NULL, NULL, NULL, NULL, NULL, '+57.8.8721605', NULL, NULL, NULL, NULL, 'hector.meneses@cadefihuila.com', 'J', 'CL', 'CV', NULL, 'Cooperativa Departamental de Caficultores del Huila 
(Cadefihuila)
Nit. 891.100.296-5
Direccion: Calle 4 No. 3-37 
Neiva (Huila)
Tels. +57.8.8721605
Gerente General: Saúl San Miguel 
Emails: ubeimar.magon@cadefihuila.com
            hector.meneses@cadefihuila.com', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1611, '(Minasul) Cooperativa Agroindustrial de Varginha LTDA', 'Minasul', 'Rua João Alves de Miranda S/N, Vila Paiva', NULL, NULL, NULL, 'Varginha - MG / 37018-070', NULL, NULL, NULL, '(35) 3219-6988', NULL, NULL, NULL, NULL, 'exportacao@minasul.com.br', 'J', 'CL', 'CV', NULL, 'Cooperativa Agroindustrial de Varginha LTDA
Rua João Alves de Miranda S/N
Vila Paiva CEP 37.018-070
Varginha-MG
CNPJ: 25.863.341/001-11
IE: 707 047 486-0028
exportacao@minasul.com.br', '25.863.341/0001-11', NULL, '707 047 486-0028', true, 7, 7, NULL, NULL, NULL, NULL),
(1669, '.BAKR SAMIR SHARKAS', 'BAKR SAMIR SHARKAS / OMAR SAMIR SHARKAS EST.', 'Al Baramkeh, Free Zone', NULL, 'Jaghnoun Building 4th floor', NULL, 'Damascus - Syria', NULL, NULL, NULL, '9631121670012', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'Contact: Mr. Nabil Rifaai', 'BAKR SAMIR SHARKAS
OMAR SAMIR SHARKAS EST.
Jaghnoun Building
Al Baramkeh, Free Zone
Damascus Syria
Company Type: Sole Proprietorship Independent


General Manager - Omar Samir Sharkas
Manager - Katrina Abdulsamad', NULL, NULL, NULL, true, 7, 15, NULL, NULL, NULL, NULL),
(976, 'A. Van Weely B.V.', NULL, 'Bijdorp 2, 1181 MZ Amstelveen', NULL, NULL, NULL, 'The Netherlands', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'FLO ID 1000
RA_00107652207  
23/02/2023              
EORI no. NL001642467 (25/06/2025)', 'Message received on April 23rd, 2025:

Bank details:
Beneficiary: A. Van Weely B.V.
IBAN-code: NL08 RABO 0355824817
Swift/BIC-code: RABONL2U
Telefoon +31 88 72 71163
Trade.servicedesk@rabobank.nl
Trade Services UW 5, Winthontlaan 1, 3526 KV Utrecht, 
The Netherlands

Message received on September 14th, 2011:
Please inform all your exporters that, as per today, the new address for sending original documents through Bank Collection is : 

ABN AMRO Bank NV
COMMODITIES TRADE SERVICE (CTS)
Gustav Mahlerlaan 10
1082 PP Amsterdam
The Netherlands

PAC: HQ0054
Tel. no. +31 (0)20 343 3774
Fax no. +31 (0)20 343 3907
Swift : FTSBNL2R

The address at "PRINS BERNHARDPLEIN 200" is no longer valid. 
Please make sure no documentation is being sent there.

Of course, original documents can also be sent "In Trust" directly to our office:

A. Van Weely B.V.
Bijdorp 2
1181 MZ  Amstelveen 
Netherlands
P.O. Box 552', NULL, NULL, NULL, true, NULL, 7, NULL, NULL, NULL, NULL),
(1418, 'ABC', '123', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', NULL, 'CV', NULL, NULL, NULL, NULL, NULL, true, 15, 15, NULL, NULL, NULL, NULL),
(1490, 'Agricoffee - Consultoria, Projetos e Logística Agroindustrial LTDA.', 'AGRICOFFEE', 'Rua Jose De Anchieta, 136', NULL, 'Lauro de Freitas, Bahia 42700-000', NULL, NULL, NULL, NULL, NULL, '71 3241-5500', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'AGRICOFFEE - CONSULTORIA, PROJETOS 
E LOGISTICA AGROINDUSTRIAL LTDA
CNPJ : 08.578.167/0001-46
Inscrição Municipal : 0010012043
Endereço: Rua Jose De Anchieta, 136
Cond. Empresarial Recreio; Galpão 01; Bairro: Caji
Município: LAURO DE FREITAS
UF: BA
CEP: 42700-000
Tel.: 71 3241-5500', '08.578.167/0001-46', '0010012043', NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(984, 'Ahold Coffee Company B.V.', 'Ahold Coffee', 'Hoofdtocht, 3 /', NULL, '1507 CJ - Zaandam', NULL, NULL, NULL, NULL, NULL, '31 756593267', NULL, NULL, NULL, NULL, '1\u0000�r`�2\u0002z�`�\u0015�\u0016�k�\r<Q4:eȊx�7\u0000���\u0013�.B��V\u0019�r�p\u0007�Yʧ+9kbU''f���}~+��\u0000h\u001f���>h�\u000f\f<\r�Ȃ[��\t\u0005���6��z��`��W��O^��7���{ �\r�n��z6\u0004�S�\u0018\u0011��|Qaj�\u0012�*�Z�̰�O>��\\<���Fy�\u001d�j\u000e8��\u0015RzhvR���{\/¯�\u001aޑg�?�u;�R��z�[���4G��%>�p\u0006U�d\u0000\u001c|�x�\"��5�Η�O��\u0000�\u001e\u001f���ɲ\u001a��vvj�\u0005��\r� \u0019 b4f q��+�j\"�9�3晿g�^���\u000bq�D<\u00176�ڃ�$��\u000eI�6}��&?7vv�N*�\u0001u=W�s��MR\r;D��8��Oܪ\u0011�\u001c`a�]�R2@R�\u0002\u0017\u0018���\u0007��~+���''aa<V2�\u0004�\u0017�#��?�\u0015T�\u0002�FNz\u0013�\u0004�>\u0007�K|l�ܱ5���|C�H�Y4��\u0011\u001e9;���;H��R\u0001�\u000f+N�''4��\u000f\u001b|-�׵�\u0000��5�🆑\u0016H.]��p�\u0000B�v0�\u0012��z;qGſ��>#��\u0010x''N�tM^��g\u0017\tj�oP\u0018\u0015\/\u001a�\r��\u000f����\u0014_\u0013�\u0000�C�UC�Z���\u0001��?�w�\"յ\u000b����''w�\/��\u0005wp�', 'J', 'CL', 'CV', 'VAT NL002230987B01', 'Mr. Niels Andresen

Cancelled by Ahold:
Received on January 09th, 2009 - 
Our bank details are:
Ahold Coffee Company
Bank account number: 46.43.27.261.
ABN-AMRO  in Zaandam, The Netherlands
Swiftcode ABNANL2A.
IBAN 42ABNA0464327261

Message received on December 21st, 2009:

Please note that we have a new b/l instruction for all coming shipments. Please inform all suppliers to use the below b/l instruction. 

SHIPPER         
NAME OF SUPPLIER 
        
CONSIGNEE         
Ahold Coffee Company 
C/O 
Hansson BV 
Overtoom 4 
8604 EW Sneek 
the Netherlands 
att. mr. Kevin Koster 
Tel. +31 (0) 186 66 7111 
        
NOTIFY 
SAME AS CONSIGNEE 

Warehousing:
Matcar Warehousing, Terminal: MEO, Platformweg 21,
1951 NJ Velsen-Noord, NL.

Sitos Commodities Amsterdam.
Westpoort 7905, Accraweg 39, 1047 HJ Amsterdam, NL.', NULL, NULL, NULL, true, NULL, 7, '����\u0000\u0010JFIF\u0000\u0001\u0001\u0001\u0000`\u0000`\u0000\u0000��\u0000C\u0000\u0006\u0004\u0005\u0006\u0005\u0004\u0006\u0006\u0005\u0006\u0007\u0007\u0006\b\n\u0010\n\n\t\t\n\u0014\u000e\u000f\f\u0010\u0017\u0014\u0018\u0018\u0017\u0014\u0016\u0016\u001a\u001d%\u001f\u001a\u001b#\u001c\u0016\u0016', NULL, NULL, false),
(987, 'Alessie & Co B.V.', 'Alessie', 'Bijdorp 2, 1180 AN Amstelveen', NULL, 'P.O. Box 552', NULL, NULL, 'The Netherlands', NULL, NULL, '(31) 703129889', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Notify-address:
United Logistic Services B.V.
Beursplein 37
Office 503-504
3011 AA Rotterdam
The Netherlands

Consignee:  to order

Message received on September 14th, 2011:

Please inform all your exporters that, as per today, 
the new address for sending original documents through Bank Collection is : 

ABN AMRO Bank NV
COMMODITIES TRADE SERVICE (CTS)
Gustav Mahlerlaan 10
1082 PP Amsterdam
The Netherlands

PAC: HQ0054
Tel. no. +31 (0)20 343 3774
Fax no. +31 (0)20 343 3907
Swift : FTSBNL2R

Of course, original documents can also be sent "In Trust" directly to our office:
Alessie & Co B.V.
Bijdorp 2
1181 MZ  Amstelveen 
The Netherlands
P.O. Box 552, 1180 AN Amestelveen,
The Netherlands', NULL, NULL, NULL, true, NULL, 7, NULL, NULL, NULL, NULL),
(1517, 'Ally Coffee Trading SA', 'Ally Coffee Trading SA', 'Rue Caroline 2', NULL, NULL, NULL, '1003 Lausanne - Switzerland', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'VAT number: CHE132925055', 'Beneficiary''s Name: Ally coffee Trading S.A.
Beneficiary''s Address: Chemin des Retraites 11
Lausanne - Switzerland - 1004
Beneficiary''s Account Number: 1631456
 
Beneficiary Bank:
Bank Name: Brown Brothers Harriman & Co
Bank Address: 140 Broadway New York, NY 10005
Swift Code: BBHCUS3I
ABA: 026004802
 
Intermediary Bank:
Bank Name: CITIBANK, NY
Account #: 09250276
ABA:  021000089
 
Reason: "For further credit: ALLY Coffee Trading S.A. - ACC 1631456."

Ally Coffee Trading SA
Chemin des Restraites 11
1004 Lausanne - Switzerland', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1534, 'ANTONIO ALVES DE ANDRADE', NULL, 'FAZENDA PAO DE ACUCAR', 'ROD BR 262', 'KM 687', 'ZONA RURAL', 'ARAXA', NULL, 'MG', '38183-970', NULL, NULL, NULL, NULL, NULL, NULL, 'F', NULL, 'CV', NULL, NULL, '171.040.256-34', NULL, '00231306401-42', true, 9, 2, NULL, NULL, NULL, NULL),
(910, 'ARMAJARO - AGRI-COMMODITIES DO BRASIL LTDA', 'AGR', 'Rua do Comercio do Cafe', '346', NULL, NULL, 'VARGINHA', NULL, 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '09.288.149/0003-54', NULL, '001.085.49500-95', true, NULL, 2, NULL, NULL, NULL, NULL),
(1885, 'Arvid Nordquist HAB', 'Arvid Nordquist HAB', '175 26 Järfälla, Sweden', NULL, 'Box 619', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Sent: Thursday, July 24, 2025 9:06 AM
Subject: New adress Arvid Nordquist HAB

Since a few months Arvid Nordquist HAB has been in the process
of moving our head office and roastery from Solna, which will be
closed, to a newly built facility in the Järfälla municipality. 
The new roastery is in full swing but the new office will officially 
open the 4th of august. We are now ready to receive post and 
green coffee samples to our new facility.

Post address:
Arvid Nordquist HAB
Box 619
175 26 Järfälla
Sweden

Courier address
Arvid Nordquist HAB
Green Coffee Quality dep
Att: Marcus Burman
Enköpingsvägen 100
177 58 Järfälla
Sweden', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1003, 'Atlantic USA LLC', 'Atlantic USA LLC', '17 State St., 23rd Floor', NULL, 'New York, NY 10004', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'ATLANTIC (USA) INC.
ATLANTIC
HAENK/JOHN


Bank Instructions:

Have the supplier submit this information to their bank: 

Brown Brothers Harriman & Co. 
140 Broadway 
New York, NY 10005 
Attention : Collection Department 
#212 - 493 - 8822', NULL, NULL, NULL, true, NULL, 7, NULL, NULL, NULL, NULL),
(945, 'Atlântica Exportação e Importação Ltda.', 'Atlântica', 'Av. Barão Homem de Melo', '4554', 'cj. 1318', NULL, 'Belo Horizonte', NULL, 'MG', '30494-270', '31 3308-6208', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Message received on March 07th, 2017:

Please find below our new FDA # 17750675708.


Dados fiscais: (07/08/2017)

Atlantica Exportação e Importação LTDA
CNPJ: 03.936.815/0001-75
Avenida Centenário, 551, Bom Pastor
CEP: 369000-000 Manhuaçu, NG - Brasil', '03.936.815/0001-75', NULL, '394.094..584-0042', false, NULL, 7, NULL, NULL, NULL, NULL),
(1531, 'Atlantica Exportação e Importacão S.A.', 'Atlantica Exportação e Importação S.A.', 'Avenida Barão do Rio Branco,', '330', NULL, NULL, 'Centenário, Manhuaçu -', NULL, 'MG', '36.902-030', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Atlantica Exportação e Importação S.A.
Av. Barão do Rio Branco,330, Centenário, 36.902-030
Manhuaçu Minas Gerais Brazil', '03.936.815 / 0001-75', NULL, '394.094.584-0042', true, 7, 7, NULL, NULL, NULL, NULL),
(1821, 'Atlantica Exportacao e Importacao S/A', 'Atlantica Exportacao e Importacao S/A', 'Avenida Princesa do Sul', '1885', NULL, NULL, 'Varginha', NULL, 'MG', '37062-447', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '03.936.815/0001-75', NULL, '3940945840042', true, 2, 7, NULL, NULL, NULL, NULL),
(1149, 'Atlantica International Overseas LTD', NULL, 'Vanter Pool Plaza - Second Floor', NULL, 'Wickhams Cay, I-Holdtown', NULL, 'Tortola', 'British Islands', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'CV', NULL, 'Atlantica International Overseas LTD
Vanter Pool Plaza - Second Floor
Wickhams Cay,I-Holdtown - Tortola
British Islands', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1615, 'Benecke Coffee GmbH & Co. KG.', 'Benecke Coffee GmbH & Co. KG.', 'Admiralitaetstrasse 10', NULL, NULL, NULL, 'Hamburg', 'Germany', NULL, '20459', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, '[Jan 8th, 2020 as per confirmation from Theodoros (Eugen Atte)]
Samples must be sent to:
Benecke Coffee GmbH & Co. KG.
Admiralitaetstrasse 10
Hamburg
Germany
20459', NULL, NULL, NULL, true, 15, 15, NULL, NULL, NULL, NULL),
(1396, 'Bernhard Rothfos GmbH', 'Bernhard Rothfos GMBH - Hamburg', 'Coffee Plaza - Am Sandtorpark 4', NULL, NULL, NULL, 'D-20457 Hamburg', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'CV', 'Oliver Robertson - Ollie
Julian Oswald
Anja Möller', 'BERNHARD ROTHFOS GMBH
COFFEE PLAZA - AM SANDTORPARK 4
D-20457 HAMBURG

PS-samples to (One PSS 500g per contract):
Bernhard Rothfos GmbH     
Coffee Plaza              
Am Sandtorpark 4          
DE-20457 Hamburg          

Documents to be sent to:
Bernhard Rothfos 
Attn of. Beate Gerken
Coffee Plaza, Am Sandtorpark 4, 20457 Hamburg, Germany
Tel.: + 49 40 37001202

Bank Collection
Bank Name: Commerzbank AG
Bank Address: Amsinckstraße 71, 20097 Hamburg, Germany
PIC Name: MSB-CB TCC Hamburg
PIC Contact: Mr. Danny Riegel (0049-40-3683-2339)
Swift Code: COBADEHHXXX', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1740, 'Bernhard Rothfos GmbH.', 'Bernhard Rothfos GmbH', 'Coffee Plaza - Am Sandtorpark 4', NULL, NULL, NULL, 'D- 20457 Hamburg', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'RE', 'CV', '***CADASTRO DOS CONTRATOS
BR GMBH VIA COFFEE HOUSE****', 'Bernhard Rothfos GmbH
Coffee Plaza - Am Sandtorpark 4
D-20457 Hamburg
Germany

***CADASTRO DOS CONTRATOS
BR GMBH VIA COFFEE HOUSE****', NULL, NULL, NULL, true, 15, 15, NULL, NULL, NULL, NULL),
(1121, 'Bernhard Rothfos Intercafe AG', 'Bernhard Rothfos', 'Bahnhofstrasse 22', NULL, NULL, 'CH 6301 Zug, Switzerland.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Bernhard Rothfos Intercafé AG
Bahnhofstrasse 22
CH-6300 Zug, Switzerland', NULL, NULL, NULL, true, NULL, 7, NULL, NULL, NULL, NULL),
(1013, 'Blaser Trading A.G.', 'Blaser Trading A.G.', 'Guterstrasse 4, CH-3001', NULL, NULL, NULL, 'Bern -', 'Switzerland', NULL, NULL, '+41 313805656', NULL, NULL, NULL, 'VAT no. CHE-107.410.115 MWST', '��0\u0004t%p>�Y�\u0000�ǂ&�%�e\u001b�\u0005�h�-e\u001be}�X��dp\u0001�zb��\n:�\n�\"u�I��{.��\u001c�o\u0016}o�z��ܾ�>ȥs�1�p\t�+ӹ�%�\u000feuq\u0016��K�(�����t\u0004��$\u000f�z�N\u0019�M6m�F\u0010�N1�k��_�QE\u0015��\u0014Q@\u0005\u0014Q@\u0005\u0014Q@\u0005\u0015��]�\u000b�[᾿��''�q\u0005�', 'J', 'CL', 'CV', 'Blaser Trading A.G.
Guterstrasse 4, CH-3001
Bern - Switzerland
VAT no. CHE-107.410.115 MWST', 'New Bank Collection Address as of Feb 23rd, 2017.
UBS SWITZERLAND AG
Trade Finance Services - F5E9
Akkreditive + Inkassi
Europastrasse 2
Postfach 8098 Zürich/Switzerland

UBS Bern, Switzerland, Account No :235-348438.60Q
BIC : UBSWCHZH8OA / IBAN : CH55 0023 5235 3484 3860 Q

[[OLD UBS ADDRESS]]
UBS AG
Bahnhofstrasse, 45
Postfach, CH-8098 Zürich
Tel. +41-44 234 11 11
SWIFT UBSWCHZH80A

[[NO LONGER SEND DOCUMENTS TO BASEL]]
UBS AG 
LCC Services / GA09 F5E9 - FEN 
Gartenstrasse 9 
CH-4002 Basel 
Switzerland 
0041 (0)61 289 34 02 

Ruth Coffee 
TAX ID / VAT Nbr: 510987829 

Kirsh Corporation (2019/05/20)
7F-107, 343 Samil-daero, Jung-gu,
Seoul, Korea
Postal code: 04538
Attn.Seonju
Tel.82-10-72623439
seonju@kirsh.kr

Café Sati
4, rue de Nantes
67027 - Strasbourg Cedex
France
Contakt Person : Mrs. Sabine Toche
Tel. : 0033 388 34 63 36
E-Mail : stoche@cafesati.com

Pacorini Silocaf S.r.l. (Trieste)
Via Caboto, 19/2
34147 TRIESTE
Italy', NULL, NULL, NULL, true, NULL, 7, '����\u0000\u0010JFIF\u0000\u0001\u0001\u0001\u0000`\u0000`\u0000\u0000��\u0000C\u0000\u0006\u0004\u0005\u0006\u0005\u0004\u0006\u0006\u0005\u0006\u0007\u0007\u0006\b\n\u0010\n\n\t\t\n\u0014\u000e\u000f\f\u0010\u0017\u0014\u0018\u0018\u0017\u0014\u0016\u0016\u001a\u001d%\u001f\u001a\u001b#\u001c\u0016\u0016', NULL, NULL, false),
(1521, 'Blaser Trading AG', 'Blaser Trading AG', 'Guterstrasse 4, CH-3001', NULL, NULL, NULL, 'Bern', 'Switzerland', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'CV', 'VAT no. CHE-107.410.115 MWST', 'New Bank Collection Address as of Feb 23rd, 2017.
UBS SWITZERLAND AG
Trade Finance / F5E9
Europastrasse 2
Postfach
8098 Zuerich/Switzerland

[[OLD UBS ADDRESS]]
UBS AG
Bahnhofstrasse, 45
Postfach, CH-8098 Zürich
Tel. +41-44 234 11 11
SWIFT UBSWCHZH80A

[[NO LONGER SEND DOCUMENTS TO BASEL]]
UBS AG 
LCC Services / GA09 F5E9 - FEN 
Gartenstrasse 9 
CH-4002 Basel 
Switzerland 
0041 (0)61 289 34 02 

Ruth Coffee 
TAX ID / VAT Nbr: 510987829 

Kirsh Corporation (new address 2017)
7F-104, 343 Samil-daero,
Jung-gu, Seoul, Korea
Postal code: 04538
Tel.82-10-72623439', NULL, NULL, NULL, true, 15, 7, NULL, NULL, NULL, NULL),
(1837, 'Blaser Trading AG_', 'Blaser Trading AG (Nestrade)', 'Guterstrasse 4, CH-3001', NULL, NULL, NULL, 'Bern,', 'Switzerland', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1380, 'BTG Pactual Commodities (Brazil) S/A', 'BTG Pactual Commodities S/A', 'Alameda do Café, 282', NULL, NULL, NULL, 'Jardim Andere, Varginha - MG', NULL, NULL, '37026-400', NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '14.796.754/0006-19', NULL, '002.360.27700-60', true, 2, 7, NULL, NULL, NULL, NULL),
(1376, 'Cafe Noble S.A./ Expocert Café S.A.', 'Cafe Noble S.A.', '50 metros este del Colegio Universitario San Judas', 'Casa #21, contiguo a FUNDECOR,', 'Rohrmoser, San José / Costa Rica.', NULL, NULL, NULL, NULL, NULL, '506 2290- 9029', NULL, NULL, NULL, NULL, 'cafenoble@racsa.co.cr', 'J', 'RE', 'CV', NULL, 'Contact.: Mr. François-Xavier Castells
email.: castells@racsa.co.cr; 

Kattia Mora
Café Noble S.A. / Expocert Café S.A.
P: (506) 2290- 9029 or (506) 2290- 9038
Skype: kattia.mora

Charlie Murillo
Expocert Café
Heredia, Costa Rica
For traffic / Tráfico: cafenoble@racsa.co.cr 
For sales / Ventas: charlie@expocert.co.cr
Office: +506 2290 9029
Cell phone: +506 8561-1683
Skype: carlosmurillov', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1156, 'CAFE TRES CORAÇOES S/A', 'CAFE TRES CORAÇOES S/A', 'RUA ZOROASTRO HENRIQUE AMORIM', '410', NULL, 'DIST. IND. CLÁUDIO GALVÃO NOGU', 'VARGINHA', NULL, 'MG', '37.066.415', '35-3214 3006', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, 'Pode emitir a NF utilizando o dólar do dia anterior para  :

TRES CORAÇÕES ALIMENTOS S/A 
ROD BR 262 KM 33,5 Nº 300
BAIRRO POUSO - ALEGRE -MANHUAÇU - (MG) 
Cep 36900-000
CNPJ 63.310.411.0004-46
INSC 394.881.434.0094 

CAFÉ TRES CORAÇÕES S/A 
RUA ZOROASTRO HENRIQUE AMORIM , 410 
DIST. IND. CLÁUDIO GALVÃO NOGUEIRA  
CIDADE -VARGINHA -MG CEP 37.066-415
CNPJ -17.467.515/0026-57  INSC 578.015.899.1250 

gentileza ficar bem atenta, pois pode ser cada mês mude a 
empresa para onde vai ser feira NF ,', '17.467.515/0026-57', NULL, '578.015.899.1250', true, 9, 4, NULL, NULL, NULL, NULL),
(1738, 'Café William Spartivento Inc.', 'EX Café Vittoria INC.', '1625 Belvédère South,', 'Sherbrooke', 'Quebec J1H 4E4, Canadá', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, '1625 Rue Belvédère S, Sherbrooke, QC J1H 4E4, Canadá

Bank Details (17/09/2019)
National Bank of Canada
Trade Finance Expertise Desk (Transit 6842-1)
600, De la Gauchetière St., 27th Floor
Montreal, QC H3B 4L2
 
Contact: Jamila Nourichafi
Phone : (514) 412-1852', NULL, NULL, NULL, true, 7, 7, NULL, NULL, NULL, NULL),
(1209, 'Cafebras - Comércio de Cafés do Brasil S/A.', 'Cafebras', 'Av. General Astolfo F. Mendes,', '650D', NULL, 'Morada do Sol,', 'Patrocínio - MG', NULL, NULL, '38.744-604', '(34) 3831-9076', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', 'CEP novo: 38744-604', 'Cafebras - Vargiinha / MG

Rua 31 de Março, nº 146
Bairro Jardim Andere
Varginha/MG
Telefone: (35)3214-2703

VAT number is as follows:
549300MU1PKAPMFR2W48', '17.611.589/0001-67', NULL, '002.101.998.0010', true, 7, 7, NULL, NULL, NULL, NULL),
(1515, 'CAFEBRAS COM. DE CAFES DO BRASIL S/A', 'CAFEBRAS', 'Rua Coronel Tamarindo', '2557', NULL, NULL, 'Franca', NULL, 'SP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'J', 'CL', 'CV', NULL, NULL, '17.611.589/0003-29', NULL, '310.672.867.114', true, 2, 2, NULL, NULL, NULL, NULL);
