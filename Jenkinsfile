pipeline
{
    agent any
    environment {
        // Replace with your actual proxy details
        HTTP_PROXY  = 'http://192.168.1.6:3128'
        HTTPS_PROXY = 'http://192.168.1.6:3128'
        VERSION = "v0.0.${BUILD_NUMBER}"
        IMAGE_NAME = "devops-dashboard"
    }
    stages{
        // stage("Checkout Code"){
        //     steps{
        //         echo "========Checkout Code========"
        //         git url: "https://github.com/Endy74757/TestWeb.git", branch: "main"
                
        //     }
        // }
        stage("Test Web"){
            steps{
                echo "========Test Web2========"
            }
        }

        stage("Build and Push Docker Image"){
            steps{
                
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "========Build and Push Docker Image========"
                        echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin
                        cat docker-compose.yml | envsubst | sudo docker compose build
                        cat docker-compose.yml | envsubst | sudo docker compose push
                        docker logout
                    '''
                }
            }
        }

        stage("Deploy To Kubernetes"){
            steps{
                dir("/k8s")
                {
                    withKubeConfig(credentialsId: "kubeconfig"){
                        withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER')]){
                            sh '''
                                echo "========Deploy To Kubernetes========"
                                cat backend-deployment.yaml | envsubst | sudo kubectl apply -f -
                                cat frontend-deployment.yaml | envsubst | kubectl apply -f -
                                sudo kubectl apply -f *-service.yaml
                                sudo kubectl get pods
                                sudo kubectl get svc
                            '''
                        }
                        
                    }    
                }
                
            }
        }
        
    }
    post {
        always{
            echo "========always========"
        }
        success{
            echo "========pipeline executed successfully ========"
        }
        failure{
            echo "========pipeline execution failed========"
        }
        cleanup {
            // ทำความสะอาด workspace
            deleteDir()
        }
    }
}
