#!/usr/bin/env python3
"""
Import just the first 10 records to test the process
"""

def create_test_batch():
    """Create a small test batch for import"""
    
    test_sql = '''INSERT INTO public.legacy_clients (
    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
    logo, logo_altura, logo_largura, auto_size
) VALUES
(1781, 'Agro Forte', 'Agro Forte', 'Rua Manoel Madeira', '67 B', NULL, 'Ind. Reinaldo Foresti', 'Varginha', 'Brasil', 'MG', '37026-560', '(35)3212-6334', NULL, NULL, NULL, NULL, NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1354, 'Alexandra de Fátima Marques', 'Alexandra de Fátima Marques', 'Sitio Santa Adelaide', NULL, NULL, 'Bairro dos Moreiras', 'Ouro Fino', 'Brazil', 'MG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1717, 'ANTONIO VANDO SANT ANA', 'LOTE 23 GLEBA 210 A PADAP', NULL, NULL, NULL, 'ZONA RURAL', 'SAO GOTARDO', NULL, 'MG', '38800000', '34 3671-2612', NULL, NULL, NULL, NULL, NULL, 'F', NULL, NULL, NULL, NULL, '301.717.416-68', NULL, '001145049.00-26', true, 9, 2, NULL, NULL, NULL, NULL),
(1564, 'Arabica Mineiro - Comércio e Exp. de Café', 'Arábica Mineiro', 'Rua Frei Alfredo', '29', NULL, 'Centro', 'Monte Belo', 'Brazil', 'MG', NULL, '(35) 99235-6083', '(35) 9971571', NULL, '(35) 99958-7863', 'arabicamineiro@hotmail.com', NULL, 'J', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL),
(1221, 'Beto Fued', 'Beto Fued', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', 'CL', NULL, NULL, NULL, NULL, NULL, NULL, true, 8, 8, NULL, NULL, NULL, NULL);'''
    
    return test_sql

if __name__ == "__main__":
    sql = create_test_batch()
    print("Test batch SQL created. Records to import:")
    print("1. Agro Forte (Varginha, MG)")
    print("2. Alexandra de Fátima Marques (Ouro Fino, MG)")
    print("3. ANTONIO VANDO SANT ANA (São Gotardo, MG)")
    print("4. Arabica Mineiro (Monte Belo, MG)")
    print("5. Beto Fued")
    print("\nSQL ready for import.")