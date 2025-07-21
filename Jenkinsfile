pipeline
{
    agent any
    environment {
        // Replace with your actual proxy details
        HTTP_PROXY  = 'http://192.168.1.6:3128'
        HTTPS_PROXY = 'http://192.168.1.6:3128'
        NO_PROXY    = 'localhost,127.0.0.1,192.168.2.3,.svc,.cluster.local'
        VERSION = "v0.0.${BUILD_NUMBER}"
        IMAGE_NAME = "devops-dashboard"
    }
    stages{
        stage("Build and Push Docker Image"){
            steps{
                
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "========Build and Push Docker Image========"
                        echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin
                        cat docker-compose.yml | envsubst | sudo -E docker compose -f - build
                        cat docker-compose.yml | envsubst | sudo -E docker compose -f - push
                        docker logout
                    '''
                }
            }
        }

        stage("Clean Old Images"){
            steps{
                sh '''
                    echo "========Clean Old Images========"
                    KEEP=5
                    IMAGES=$(sudo docker images --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | grep ".*${IMAGE_NAME}:" | sort -rk2 | awk '{print $1}')

                    DELETE_LIST="$(echo "$IMAGES" | grep "be.*" | tail -n +$(($KEEP + 1))) $(echo "$IMAGES" | grep "fe.*" |tail -n +$(($KEEP + 1)))"
                    echo $DELETE_LIST

                    for IMAGE in $DELETE_LIST
                    do
                        sudo docker rmi $IMAGE
                    done

                '''
            }
        }


        stage("Deploy To Kubernetes"){
            steps{
                withKubeConfig(credentialsId: 'kubeconfig'){
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]){
                        sh '''
                            echo "========Deploy To Kubernetes========"
                            cat k8s/backend-deployment.yaml | envsubst | kubectl apply -f -
                            cat k8s/frontend-deployment.yaml | envsubst | kubectl apply -f -
                            kubectl apply -f k8s/backend-service.yaml -f k8s/frontend-service.yaml
                            sleep 10
                            kubectl get pods
                            kubectl get svc
                        '''
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
